const { sql, getPool } = require('../config/dbconfig');

let pool;

(async () => {
    try {
        pool = await getPool();
    } catch (err) {
        console.error('Error while getting pool in equipment category controller', err);
    }
})();


async function getActiveEquipmentCategories(req, res) {
    try {
        const request = await pool.request();
        const query = 'SELECT category_id, category_name FROM mmt_equipment_category WHERE status = 1';
        const result = await request.query(query);

        if (result.recordset.length > 0) {
            return res.status(200).json({ categories: result.recordset });
        }
        return res.status(404).json({ error: "No active categories found" });
    } catch (err) {
        console.error("Error fetching categories:", err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}


async function getAllCategories(req, res) {
    try {
        const request = await pool.request();
        const query = 'SELECT * FROM mmt_equipment_category';
        const result = await request.query(query);

        return res.status(200).json({ categories: result.recordset });
    } catch (err) {
        console.error('Error fetching categories', err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}


async function getCategoryById(req, res) {
    try {
        const id = req.params.id;
        if (!id) return res.status(400).json({ error: "Category ID is required" });

        const request = await pool.request();
        request.input('id', sql.Int, id);
        const query = 'SELECT * FROM mmt_equipment_category WHERE category_id = @id';
        const result = await request.query(query);

        if (result.recordset.length > 0) {
            return res.status(200).json({ category: result.recordset[0] });
        }
        return res.status(404).json({ error: "Category not found" });
    } catch (err) {
        console.error('Error fetching category by ID', err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}


async function toggleCategoryStatus(req, res) {
    try {
        const id = req.params.id;
        if (!id || isNaN(id)) return res.status(400).json({ message: "Invalid category ID" });

        const request = await pool.request();
        request.input('id', sql.Int, id);
        const query = `UPDATE mmt_equipment_category SET status = CASE WHEN status = 1 THEN 0 ELSE 1 END WHERE category_id = @id`;
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.json({ message: "Category status toggled successfully" });
    } catch (err) {
        console.error('Error toggling category status', err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}


async function createCategory(req, res) {
    try {
        const categoryName = req.body.category_name;
        if (!categoryName) return res.status(400).json({ message: "Category name is required" });

        const request = await pool.request();
        request.input('category_name', sql.NVarChar, categoryName);
        const query = 'INSERT INTO mmt_equipment_category (category_name, status, created_on) VALUES (@category_name, 1, GETDATE())';
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(400).json({ message: "Category not created" });
        }
        return res.json({ message: "Category created successfully" });
    } catch (err) {
        console.error('Error creating category', err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}


async function updateCategory(req, res) {
    try {
        const id = req.params.id;
        const categoryName = req.body.category_name;


        if (!id || isNaN(id)) return res.status(400).json({ message: "Invalid category ID" });
        if (!categoryName) return res.status(400).json({ message: "Category name is required" });

        const request = await pool.request();
        request.input('id', sql.Int, id);
        request.input('category_name', sql.NVarChar, categoryName);
        const query = 'UPDATE mmt_equipment_category SET category_name = @category_name WHERE category_id = @id';
        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.json({ message: "Category updated successfully" });
    } catch (err) {
        console.error('Error updating category', err);
        return res.status(500).json({ message: err.message || "Internal Server Error" });
    }
}

module.exports = {
    getActiveEquipmentCategories,
    getAllCategories,
    getCategoryById,
    toggleCategoryStatus,
    createCategory,
    updateCategory,
};
