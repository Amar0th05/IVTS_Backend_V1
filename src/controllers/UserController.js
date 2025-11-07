const User = require("../models/User");
const { sql, getPool } = require("../config/dbconfig");
const { hash } = require("../Utils/hash");

let pool;

(async () => {
  try {
    pool = await getPool();
  } catch (error) {
    console.error("connection error: ", error);
  }
})();

//create user
async function registerUser(req, res) {
  try {
    const data = req.body.userData;
    // console.log(data);
    const request = pool.request();

    if (!data) {
      return res.status(400).json({ message: "No data provided" });
    }

    if (!data.role) {
      data.role = 3;
    }

    const requiredFields = ["name", "mail", "password"];
    for (const field of requiredFields) {
      if (!data[field] || data[field].trim() === "") {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    data.status = data.status && data.status.trim() !== "" ? data.status : 1;

    const hashedPassword = await hash(data.password);

    const userInstance = new User(
      null,
      data.name,
      data.mail,
      hashedPassword,
      data.status,
      data.role
    );
    console.log("userInstance", userInstance);

    if (!userInstance.isValidEmail()) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    request.input("name", sql.NVarChar(30), userInstance.name);
    request.input("mail", sql.NVarChar(320), userInstance.mail);
    request.input("password", sql.NVarChar(255), userInstance.password);
    request.input("status", sql.Bit, userInstance.status);
    request.input("role", sql.Int, userInstance.role);

    const query = `
            INSERT INTO tbl_user (name, mail, password, status, role)
            OUTPUT INSERTED.id, INSERTED.name, INSERTED.mail, INSERTED.status, INSERTED.role
            VALUES (@name, @mail, @password, @status, @role)
        `;

    const queryResult = await request.query(query);

    const user = new User(
      queryResult.recordset[0].id,
      queryResult.recordset[0].name,
      queryResult.recordset[0].mail,
      "protected data",
      queryResult.recordset[0].status,
      queryResult.recordset[0].role
    );

    res.status(201).json({ message: "User created successfully", user: user });
  } catch (err) {
    console.error("Error creating user:", err);

    if (err.number === 2627 || err.number === 2601) {
      return res.status(400).json({ message: "Email already exists" });
    }

    res
      .status(500)
      .json({
        message:
          err.response?.data?.message || err.message || "Internal Server Error",
      });
  }
}

//callback funtion to return user in router

async function getUserByEmail(req, res) {
  try {
    const mail = req.body.mail;
    if (!mail || mail.trim() === "") {
      res.status(400).json({ message: "Invalid email address" });
      return;
    }

    const user = await getUser(mail);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.password = "<PASSWORD>";
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res
      .status(500)
      .json({
        message:
          err.response?.data?.message || err.message || "Internal Server Error",
      });
  }
}

//get user by mail method

async function getUser(mail) {
  try {
    const request = await pool.request();

    request.input("mail", sql.NVarChar(320), mail);

    const query = `SELECT
        u.*,
    s.Staff_Name,
    s.Employee_ID_if_already_assigned AS Employee_ID,
    s.Designation,
    s.Gender,
    r.role AS Role_Name
FROM 
    tbl_user AS u
LEFT JOIN 
    Staffs AS s 
    ON u.mail = s.Official_Email_Address
LEFT JOIN 
    mmt_user_roles AS r 
    ON u.role = r.role_id
WHERE 
    u.mail =@mail`;

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return null;
    }
    // console.log("users",result.recordset[0]);
    return result.recordset[0];
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

async function getAllUsers(req, res) {
  try {
    const request = await pool.request();
    const query = `
            SELECT u.id   AS userID,
                   u.name AS userName,
                   u.mail AS mail,
                   u.status,
                   r.role
            FROM tbl_user u
            LEFT JOIN mmt_user_roles r
            ON u.role = r.role_id;       
        `;
    const result = await request.query(query);
    res.json({ users: result.recordset });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res
      .status(500)
      .json({
        message:
          err.response?.data?.message || err.message || "Internal Server Error",
      });
  }
}

async function toggleUserStatus(req, res) {
  try {
    const id = req.params.id;
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const request = await pool.request();

    request.input("id", sql.Int, id);

    const query = `
                            UPDATE tbl_user
                            SET status= CASE WHEN status=1 THEN 0 ELSE 1
                            END
                            where id=@id;

        
        `;
    const result = await request.query(query);
    if (result.rowsAffected === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ message: "Status toggled successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({
        message:
          err.response?.data?.message || err.message || "Internal Server Error",
      });
  }
}

async function findUserById(req, res) {
  const id = req.params.id;

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  try {
    const request = await pool.request();
    request.input("id", sql.Int, id);
    const query = `
            SELECT u.id   AS userID,
                   u.name AS userName,
                   u.mail AS mail,
                   u.status,
                   u.role
            FROM tbl_user u
            WHERE u.id = @id;           
        
        `;
    const result = await request.query(query);
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ user: result.recordset[0] });
  } catch (err) {
    return res
      .status(500)
      .json({
        message:
          err.response?.data?.message || err.message || "Internal Server Error",
      });
  }
}

async function updateUser(req, res) {
  const userData = req.body.userData;

  try {
    let updates = [];

    const request = await pool.request();

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!userData.userID) {
      return res.status(404).json({ message: "User not found" });
    }

    request.input("id", sql.Int, userData.userID);

    if (userData.name !== undefined) {
      updates.push("name = @name");
      request.input("name", sql.NVarChar(30), userData.name);
    }

    if (userData.mail !== undefined) {
      if (isValidEmail(userData.mail)) {
        updates.push("mail = @mail");
        request.input("mail", sql.NVarChar(320), userData.mail);
      } else {
        return res.status(400).json({ message: "Invalid email" });
      }
    }

    if (userData.role !== undefined) {
      updates.push("role = @role");
      request.input("role", sql.Int, userData.role);
    }

    if (userData.password !== undefined && userData.password.trim() !== "") {
      updates.push("password = @password");
      request.input(
        "password",
        sql.NVarChar(255),
        await hash(userData.password)
      );
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields provided for update" });
    }

    const query = `
                
                UPDATE tbl_user SET ${updates.join(",")}
                WHERE id=@id;
        `;
    const result = await request.query(query);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ message: "user updated successfully" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({
        message:
          err.response?.data?.message || err.message || "Internal Server Error",
      });
  }
}

function isValidEmail(mail) {
  if (!mail || typeof mail !== "string") {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(mail.toLowerCase());
}
module.exports = {
  registerUser,
  getUserByEmail,
  getUser,
  getAllUsers,
  findUserById,
  toggleUserStatus,
  updateUser,
};
