package routes

import (
	"motorguard-backend/handlers"
	"motorguard-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	// Public routes
	auth := app.Group("/api/auth")
	auth.Post("/register", handlers.RegisterUser)
	auth.Post("/login", handlers.LoginUser)

	// Protected routes
	api := app.Group("/api", middleware.AuthMiddleware)

	api.Put("/profile", handlers.UpdateProfile)

	api.Get("/facilities", handlers.GetFacilities)
	api.Post("/facilities", handlers.CreateFacility)

	api.Get("/equipment", handlers.GetEquipment)
	api.Post("/equipment", handlers.CreateEquipment)
	api.Put("/equipment/:id", handlers.UpdateEquipment)
	api.Delete("/equipment/:id", handlers.DeleteEquipment)

	api.Post("/readings", handlers.SubmitReading)
	api.Get("/readings/:equipment_id", handlers.GetReadingHistory)

	api.Get("/alerts", handlers.GetAlerts)
	api.Patch("/alerts/:id/status", handlers.UpdateAlertStatus)

	api.Get("/analytics", handlers.GetAnalytics)
}
