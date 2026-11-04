package main

import (
	"fmt"
	"log"
	"motorguard-backend/database"
	"motorguard-backend/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	// 1. Initialize Database
	database.InitDB()
	defer database.DB.Close()

	// 2. Setup Fiber
	app := fiber.New()
	app.Use(cors.New())
	app.Use(logger.New())

	// 3. Register Routes
	routes.SetupRoutes(app)

	// 4. Start Server
	fmt.Println("Server running on http://localhost:8080")
	log.Fatal(app.Listen(":8080"))
}
