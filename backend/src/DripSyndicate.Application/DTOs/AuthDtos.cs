namespace DripSyndicate.Application.DTOs;

public record RegisterRequest(string Email, string Password, string FullName, string? Phone);
public record LoginRequest(string Email, string Password);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);
public record RefreshRequest(string RefreshToken);

public record AuthResponse(
    Guid UserId, string Email, string FullName, string[] Roles,
    string AccessToken, string RefreshToken, int ExpiresIn);
