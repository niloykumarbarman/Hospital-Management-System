using System.Net;
using System.Text.Json;

namespace HMS.API.Middleware;

// Centralized exception handling middleware.
// Catches unhandled exceptions from the request pipeline and converts them
// into a consistent JSON error response with the correct HTTP status code.
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = exception switch
        {
            KeyNotFoundException => HttpStatusCode.NotFound,
            InvalidOperationException => HttpStatusCode.BadRequest,
            UnauthorizedAccessException => HttpStatusCode.Forbidden,
            ArgumentException => HttpStatusCode.BadRequest,
            _ => HttpStatusCode.InternalServerError
        };

        // Log the full exception details server-side (Serilog picks this up).
        // For unexpected (500) errors, log as Error; for expected business
        // exceptions (404/400/403), log as Warning to avoid noisy error logs.
        if (statusCode == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(exception, "Unhandled exception occurred while processing {Path}", context.Request.Path);
        }
        else
        {
            _logger.LogWarning("{ExceptionType} occurred while processing {Path}: {Message}",
                exception.GetType().Name, context.Request.Path, exception.Message);
        }

        // Never leak internal exception details to the client for 500 errors.
        var clientMessage = statusCode == HttpStatusCode.InternalServerError
            ? "An unexpected error occurred. Please try again later."
            : exception.Message;

        var response = new
        {
            statusCode = (int)statusCode,
            message = clientMessage,
            timestamp = DateTime.UtcNow,
            path = context.Request.Path.Value
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}
