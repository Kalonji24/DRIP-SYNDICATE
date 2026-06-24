namespace DripSyndicate.Application.Common.Models;

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)Math.Max(PageSize, 1));
    public bool HasNext => Page < TotalPages;
    public bool HasPrevious => Page > 1;
}
