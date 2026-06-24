namespace DripSyndicate.Application.Common.Models;

/// <summary>Lightweight result type so the API layer can map outcomes to HTTP status codes.</summary>
public class Result
{
    public bool Succeeded { get; init; }
    public string? Error { get; init; }
    public int StatusCode { get; init; } = 200;

    public static Result Success(int status = 200) => new() { Succeeded = true, StatusCode = status };
    public static Result Failure(string error, int status = 400) =>
        new() { Succeeded = false, Error = error, StatusCode = status };
}

public class Result<T> : Result
{
    public T? Data { get; init; }
    public static Result<T> Success(T data, int status = 200) =>
        new() { Succeeded = true, Data = data, StatusCode = status };
    public static new Result<T> Failure(string error, int status = 400) =>
        new() { Succeeded = false, Error = error, StatusCode = status };
}
