package handlers

import (
	"motorguard-backend/database"
	"motorguard-backend/models"

	"github.com/gofiber/fiber/v2"
)

// --- FACILITIES ---
func GetFacilities(c *fiber.Ctx) error {
	customerID := c.Locals("customer_id").(int)

	rows, err := database.DB.Query(`SELECT id, name, location FROM facilities WHERE customer_id = $1`, customerID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	defer rows.Close()

	facilities := []models.Facility{}
	for rows.Next() {
		var f models.Facility
		f.CustomerID = customerID
		rows.Scan(&f.ID, &f.Name, &f.Location)
		facilities = append(facilities, f)
	}
	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error reading data"})
	}

	return c.JSON(facilities)
}

func CreateFacility(c *fiber.Ctx) error {
	if c.Locals("role").(string) == "Viewer" {
		return c.Status(403).JSON(fiber.Map{"error": "Unauthorized"})
	}
	f := new(models.Facility)
	if err := c.BodyParser(f); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	var id int
	err := database.DB.QueryRow(`INSERT INTO facilities (customer_id, name, location) VALUES ($1, $2, $3) RETURNING id`, c.Locals("customer_id").(int), f.Name, f.Location).Scan(&id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create facility"})
	}
	return c.Status(201).JSON(fiber.Map{"message": "Facility created", "id": id})
}

// --- EQUIPMENT ---
func GetEquipment(c *fiber.Ctx) error {
	rows, err := database.DB.Query(`
		SELECT e.id, e.facility_id, e.name, e.motor_type, e.rated_voltage, e.rated_current, e.rated_rpm, e.status 
		FROM equipment e JOIN facilities f ON e.facility_id = f.id WHERE f.customer_id = $1`, c.Locals("customer_id").(int))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	defer rows.Close()

	equipments := []models.Equipment{}
	for rows.Next() {
		var eq models.Equipment
		rows.Scan(&eq.ID, &eq.FacilityID, &eq.Name, &eq.MotorType, &eq.RatedVoltage, &eq.RatedCurrent, &eq.RatedRPM, &eq.Status)
		equipments = append(equipments, eq)
	}
	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error reading data"})
	}
	return c.JSON(equipments)
}

func CreateEquipment(c *fiber.Ctx) error {
	if c.Locals("role").(string) == "Viewer" {
		return c.Status(403).JSON(fiber.Map{"error": "Unauthorized"})
	}
	eq := new(models.Equipment)
	if err := c.BodyParser(eq); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	var valid int
	err := database.DB.QueryRow("SELECT id FROM facilities WHERE id = $1 AND customer_id = $2", eq.FacilityID, c.Locals("customer_id").(int)).Scan(&valid)
	if err != nil {
		return c.Status(403).JSON(fiber.Map{"error": "Invalid facility or unauthorized"})
	}

	var id int
	err = database.DB.QueryRow(`INSERT INTO equipment (facility_id, name, motor_type, rated_voltage, rated_current, rated_rpm, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`, eq.FacilityID, eq.Name, eq.MotorType, eq.RatedVoltage, eq.RatedCurrent, eq.RatedRPM, "Active").Scan(&id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to add equipment"})
	}
	return c.Status(201).JSON(fiber.Map{"message": "Equipment added", "id": id})
}

func UpdateEquipment(c *fiber.Ctx) error {
	if c.Locals("role").(string) == "Viewer" {
		return c.Status(403).JSON(fiber.Map{"error": "Unauthorized"})
	}
	eq := new(models.Equipment)
	if err := c.BodyParser(eq); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	res, err := database.DB.Exec(`UPDATE equipment SET name = $1, status = $2, updated_at = NOW() WHERE id = $3 AND facility_id IN (SELECT id FROM facilities WHERE customer_id = $4)`, eq.Name, eq.Status, c.Params("id"), c.Locals("customer_id").(int))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	if rowsAffected, _ := res.RowsAffected(); rowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Not found or unauthorized"})
	}
	return c.JSON(fiber.Map{"message": "Equipment updated"})
}

func DeleteEquipment(c *fiber.Ctx) error {
	if c.Locals("role").(string) != "Admin" {
		return c.Status(403).JSON(fiber.Map{"error": "Only Admins can delete"})
	}
	res, err := database.DB.Exec(`DELETE FROM equipment WHERE id = $1 AND facility_id IN (SELECT id FROM facilities WHERE customer_id = $2)`, c.Params("id"), c.Locals("customer_id").(int))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}

	if rowsAffected, _ := res.RowsAffected(); rowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Not found or unauthorized"})
	}
	return c.JSON(fiber.Map{"message": "Equipment deleted"})
}

// --- ALERTS ---
func GetAlerts(c *fiber.Ctx) error {
	rows, err := database.DB.Query(`
		SELECT a.id, a.equipment_id, e.name, a.parameter, a.severity, a.message, a.is_resolved 
		FROM fault_alerts a JOIN equipment e ON a.equipment_id = e.id JOIN facilities f ON e.facility_id = f.id
		WHERE f.customer_id = $1 ORDER BY a.created_at DESC`, c.Locals("customer_id").(int))

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	defer rows.Close()

	alerts := []models.AlertResponse{}
	for rows.Next() {
		var a models.AlertResponse
		rows.Scan(&a.ID, &a.EquipmentID, &a.EquipName, &a.Parameter, &a.Severity, &a.Message, &a.IsResolved)
		alerts = append(alerts, a)
	}
	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error reading data"})
	}
	return c.JSON(alerts)
}

func UpdateAlertStatus(c *fiber.Ctx) error {
	res, err := database.DB.Exec(`
		UPDATE fault_alerts SET is_resolved = TRUE, resolved_by = $1, resolved_at = NOW()
		WHERE id = $2 AND equipment_id IN (SELECT e.id FROM equipment e JOIN facilities f ON e.facility_id = f.id WHERE f.customer_id = $3)`,
		c.Locals("user_id").(int), c.Params("id"), c.Locals("customer_id").(int))

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	if rowsAffected, _ := res.RowsAffected(); rowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Not found or unauthorized"})
	}
	return c.JSON(fiber.Map{"message": "Alert resolved"})
}

// --- ANALYTICS ---
func GetAnalytics(c *fiber.Ctx) error {
	customerID := c.Locals("customer_id").(int)
	var totalFacilities, totalEquipment, activeEquipment, criticalAlerts int

	database.DB.QueryRow("SELECT COUNT(*) FROM facilities WHERE customer_id = $1", customerID).Scan(&totalFacilities)
	database.DB.QueryRow(`SELECT COUNT(*), COALESCE(SUM(CASE WHEN e.status = 'Active' THEN 1 ELSE 0 END), 0) FROM equipment e JOIN facilities f ON e.facility_id = f.id WHERE f.customer_id = $1`, customerID).Scan(&totalEquipment, &activeEquipment)
	database.DB.QueryRow(`SELECT COUNT(*) FROM fault_alerts a JOIN equipment e ON a.equipment_id = e.id JOIN facilities f ON e.facility_id = f.id WHERE f.customer_id = $1 AND a.severity = 'CRITICAL' AND a.is_resolved = FALSE`, customerID).Scan(&criticalAlerts)

	return c.JSON(fiber.Map{
		"total_facilities": totalFacilities, "total_equipment": totalEquipment,
		"active_equipment": activeEquipment, "critical_alerts": criticalAlerts,
	})
}
