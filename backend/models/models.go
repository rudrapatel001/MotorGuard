package models

type User struct {
	ID         int    `json:"id"`
	CustomerID int    `json:"customer_id"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	Role       string `json:"role"`
}

type AuthRequest struct {
	Name       string `json:"name"`
	Email      string `json:"email"`
	Password   string `json:"password"`
	CustomerID int    `json:"customer_id"`
	Role       string `json:"role"`
}

type Facility struct {
	ID         int    `json:"id"`
	CustomerID int    `json:"customer_id"`
	Name       string `json:"name"`
	Location   string `json:"location"`
}

type Equipment struct {
	ID               int     `json:"id"`
	FacilityID       int     `json:"facility_id"`
	Name             string  `json:"name"`
	MotorType        string  `json:"motor_type"`
	RatedVoltage     float64 `json:"rated_voltage"`
	RatedCurrent     float64 `json:"rated_current"`
	RatedRPM         int     `json:"rated_rpm"`
	InstallationDate string  `json:"installation_date"`
	Status           string  `json:"status"`
}

type Reading struct {
	EquipmentID int     `json:"equipment_id"`
	Voltage     float64 `json:"voltage"`
	Current     float64 `json:"current"`
	Frequency   float64 `json:"frequency"`
	Temperature float64 `json:"temperature"`
	Vibration   float64 `json:"vibration"`
	Timestamp   string  `json:"timestamp"`
}

type AlertResponse struct {
	ID          int    `json:"id"`
	EquipmentID int    `json:"equipment_id"`
	EquipName   string `json:"equip_name"`
	Parameter   string `json:"parameter"`
	Severity    string `json:"severity"`
	Message     string `json:"message"`
	IsResolved  bool   `json:"is_resolved"`
}
