const {sql,getPool} = require('../config/dbconfig')

let pool;

(async ()=>{
    try{
        pool = await getPool();
    }catch(err){
        console.error('Error while getting pool in staff details controller', err);
    }
})();

async function getActiveCourses(req, res) {
    try {
        const request = await pool.request();

        const query = `SELECT course_id, course_name FROM mmt_courses WHERE status = 1;`;
        const result = await request.query(query);

        if (result.recordset.length > 0) {

            return res.status(200).json({ courses: result.recordset });
        } else {
            return res.status(404).json({ error: "No courses found" });
        }
    } catch (err) {
        console.error("Error fetching courses:", err);
        return res.status(500).json({ message: err.response?.data?.message || err.message || "Internal Server Error"  });
    }
}
async function getAllCourses(req,res){
    try{
        const request=await pool.request();
        const query = `SELECT * FROM mmt_courses;`;
        const result=await request.query(query);
        if(result.recordset.length>0){
            const data=result.recordset;
            let courses=[];

            data.map(course=>{
                courses.push({
                    courseID:course.course_id,
                    courseName:course.course_name,
                    status:course.status,
                    createdOn:course.created_on
                })
            });

            return res.status(200).json({courses});
        }
        return res.status(404).json({error:"No courses found"});
    }catch(err){
        console.error('Error while getting courses',err);
        return res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}
async function getCourseById(req, res) {
    try{
        const id = req.params.id;

        console.log(id);
        console.log(req.params.id);
        console.log(req.params);

        if(!id){
            return res.status(400).json({error:"Course id is required"});
        }
        const request = await pool.request();

        request.input('id',sql.Int,id);

        const query = 'SELECT * FROM mmt_courses WHERE course_id=@id';
        const result = await request.query(query);
        if(result.recordset.length>0){
            return res.status(200).json({course:result.recordset[0]});
        }
        return res.status(404).json({error:"Course not found"});
    }catch(err){
        console.error('Error while getting course by id',err);
        return res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}

async function toggleCourseStatus(req,res){
    try{
        const id=req.params.id;
        if(!id||isNaN(id)){
            return res.status(400).json({message:"Invalid course"});
        }
        const request=await pool.request();

        request.input('id',sql.Int,id);

        const query=`
                            UPDATE mmt_courses
                            SET status= CASE WHEN status=1 THEN 0 ELSE 1
                            END
                            where course_id=@id;

        
        `;
        const result=await request.query(query);
        if(result.rowsAffected===0){
            return res.status(404).json({message:"course not found"});
        }
        return res.json({message:"Status toggled successfully"});
    }catch(error){
        return res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}


async function createCourse(req,res){
    try{
        const courseName=req.body.courseName;
        if(!courseName){
            return res.status(400).json({message:"Course name is required"});
        }

        const request=await pool.request();
        request.input('courseName',sql.NVarChar,courseName);
        const query=`
                            INSERT INTO mmt_courses(course_name) VALUES(@courseName);
        `;

        const result=await request.query(query);
        if(result.rowsAffected===0){
            return res.status(401).json({message:"Course not created"});
        }
        return res.json({message:"Course created successfully"});

    }catch(err){
        return res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}

async function updateCourse(req,res){
    try{
        const courseName=req.body.courseName;
        const id=req.params.id;
        if(!id||isNaN(id)){
            return res.status(400).json({message:"Invalid course"});
        }

        if(!courseName){
            return res.status(400).json({message:"Course name is required"});
        }
        const request=await pool.request();

        request.input('courseName',sql.NVarChar,courseName);
        request.input('id',sql.Int,id);


        const query=`
                    UPDATE mmt_courses
                    SET course_name=@courseName
                    WHERE course_id=@id;
        `;
        const result=await request.query(query);
        if(result.rowsAffected===0){
            return res.status(404).json({message:"course not found"});
        }
        return res.json({message:"Course updated successfully"});
    }catch(err){
        return res.status(500).json({message: err.response?.data?.message || err.message || "Internal Server Error" });
    }
}


module.exports={
    getActiveCourses,
    getAllCourses,
    getCourseById,
    toggleCourseStatus,
    createCourse,
    updateCourse,
}