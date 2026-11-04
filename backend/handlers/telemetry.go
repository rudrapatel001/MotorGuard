package handlers

import (
	"database/sql"
	"fmt"
	"motorguard-backend/database"
	"motorguard-backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
)

func evaluateFaults(equipmentID int, r *models.Reading) {
	checkAndAlert := func(parameter string, isFault bool, severity, message string) {
		if !isFault {
			return
		}
		var existingID int
		err := database.DB.QueryRow(`SELECT id FROM fault_alerts WHERE equipment_id = $1 AND parameter = $2 AND is_resolved = FALSE`, equipmentID, parameter).Scan(&existingID)
		if err == sql.ErrNoRows {
			database.DB.Exec(`INSERT INTO fault_alerts (equipment_id, parameter, severity, message) VALUES ($1, $2, $3, $4)`, equipmentID, parameter, severity, message)
		}
	}
	checkAndAlert("voltage", r.Voltage < 380 || r.Voltage > 440, "CRITICAL", fmt.Sprintf("Abnormal voltage: %.2fV", r.Voltage))
	checkAndAlert("current", r.Current < 0 || r.Current > 15, "HIGH", fmt.Sprintf("Overcurrent detected: %.2fA", r.Current))
	checkAndAlert("temperature", r.Temperature >= 80, "CRITICAL", fmt.Sprintf("Overheating: %.2f°C", r.Temperature))
	checkAndAlert("vibration", r.Vibration >= 5, "MEDIUM", fmt.Sprintf("High vibration: %.2f mm/s", r.Vibration))
}

func SubmitReading(c *fiber.Ctx) error {
	customerID := c.Locals("customer_id").(int)
	r := new(models.Reading)
	if err := c.BodyParser(r); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	var validID int
	var status string

	err := database.DB.QueryRow(`SELECT e.id, e.status FROM equipment e JOIN facilities f ON e.facility_id = f.id WHERE e.id = $1 AND f.customer_id = $2`, r.EquipmentID, customerID).Scan(&validID, &status)
	if err != nil {
		return c.Status(403).JSON(fiber.Map{"error": "Invalid equipment or unauthorized"})
	}

	timestamp := time.Now().Format(time.RFC3339)
	if r.Timestamp != "" {
		timestamp = r.Timestamp
	}

	_, err = database.DB.Exec(`INSERT INTO electrical_readings (equipment_id, voltage, current, frequency, temperature, vibration, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)`, r.EquipmentID, r.Voltage, r.Current, r.Frequency, r.Temperature, r.Vibration, timestamp)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save reading"})
	}

	if status == "Active" {
		evaluateFaults(r.EquipmentID, r)
	}

	return c.Status(201).JSON(fiber.Map{"message": "Reading saved successfully"})
}

func GetReadingHistory(c *fiber.Ctx) error {
	equipmentID := c.Params("equipment_id")
	startDate := c.Query("start", "1970-01-01")
	endDate := c.Query("end", "2099-12-31")

	var valid int
	err := database.DB.QueryRow("SELECT e.id FROM equipment e JOIN facilities f ON e.facility_id = f.id WHERE e.id = $1 AND f.customer_id = $2", equipmentID, c.Locals("customer_id").(int)).Scan(&valid)
	if err != nil {
		return c.Status(403).JSON(fiber.Map{"error": "Unauthorized"})
	}

	rows, err := database.DB.Query(`SELECT voltage, current, frequency, temperature, vibration, timestamp FROM electrical_readings WHERE equipment_id = $1 AND timestamp >= $2 AND timestamp <= $3 ORDER BY timestamp ASC LIMIT 100`, equipmentID, startDate, endDate)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error"})
	}
	defer rows.Close()

	readings := []models.Reading{}
	for rows.Next() {
		var r models.Reading
		rows.Scan(&r.Voltage, &r.Current, &r.Frequency, &r.Temperature, &r.Vibration, &r.Timestamp)
		readings = append(readings, r)
	}
	if err := rows.Err(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error reading history"})
	}
	return c.JSON(readings)
}
