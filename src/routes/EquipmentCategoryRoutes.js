const {
    getActiveEquipmentCategories,
   getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    toggleCategoryStatus
} = require("../controllers/EquipmentCategoryController");
const {authorizeRole} = require("../middlewares/rbacMiddleware");

const equipmentCategoryRoutes = require("express").Router();


equipmentCategoryRoutes.get("/all/active", getActiveEquipmentCategories);


equipmentCategoryRoutes.get("/all",authorizeRole([2]), getAllCategories);


equipmentCategoryRoutes.get("/:id", authorizeRole([2]),getCategoryById);


equipmentCategoryRoutes.post("/create", authorizeRole([2]),createCategory);


equipmentCategoryRoutes.put("/:id", authorizeRole([2]),updateCategory);


equipmentCategoryRoutes.put("/status/:id", authorizeRole([2]),toggleCategoryStatus);

module.exports = equipmentCategoryRoutes;
