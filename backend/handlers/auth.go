package handlers

import (
	"motorguard-backend/database"
	"motorguard-backend/middleware"
	"motorguard-backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func RegisterUser(c *fiber.Ctx) error {
	req := new(models.AuthRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	var customerID int
	err := database.DB.QueryRow("SELECT id FROM customers WHERE id = $1", req.CustomerID).Scan(&customerID)
	if err != nil {
		err = database.DB.QueryRow("INSERT INTO customers (name) VALUES ($1) RETURNING id", "Default Customer").Scan(&customerID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create customer"})
		}
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 10)

	var userID int
	err = database.DB.QueryRow(`
		INSERT INTO users (customer_id, name, email, password_hash, role) 
		VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		customerID, req.Name, req.Email, hashedPassword, req.Role,
	).Scan(&userID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Email already exists or database error"})
	}

	return c.Status(201).JSON(fiber.Map{"message": "User registered successfully", "user_id": userID})
}

func LoginUser(c *fiber.Ctx) error {
	req := new(models.AuthRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	var user models.User
	var hash string

	err := database.DB.QueryRow("SELECT id, customer_id, name, email, role, password_hash FROM users WHERE email = $1", req.Email).
		Scan(&user.ID, &user.CustomerID, &user.Name, &user.Email, &user.Role, &hash)

	if err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":     user.ID,
		"customer_id": user.CustomerID,
		"role":        user.Role,
		"exp":         time.Now().Add(time.Hour * 72).Unix(),
	})

	t, err := token.SignedString([]byte(middleware.JWTSecret))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not login"})
	}

	return c.JSON(fiber.Map{"token": t, "user": user})
}

// Add this new function to handle profile name changes
func UpdateProfile(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int)
	type ProfileUpdate struct {
		Name string `json:"name"`
	}

	req := new(ProfileUpdate)
	if err := c.BodyParser(req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	_, err := database.DB.Exec("UPDATE users SET name = $1 WHERE id = $2", req.Name, userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update profile"})
	}

	return c.JSON(fiber.Map{"message": "Profile updated successfully"})
}
