"use strict";

// Hàm fetch TMDB dùng chung cho trang chủ và movie.html.
// Giữ chữ ký getData(path, extra) để các luồng đã làm không phải viết lại.
async function getData(path, extra = "") {
  if (!TMDB_CONFIG.API_KEY) throw new Error("Configure your TMDB API key in assets/js/config.js.");
  const url = new URL(TMDB_CONFIG.API_URL + path);
  url.searchParams.set("api_key", TMDB_CONFIG.API_KEY);
  url.searchParams.set("language", TMDB_CONFIG.LANGUAGE);

  // Mã cũ truyền extra như &query=... hoặc &append_to_response=credits.
  const params = new URLSearchParams(extra.replace(/^[?&]/, ""));
  params.forEach((value, key) => url.searchParams.set(key, value));

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 401) throw new Error("TMDB API key is missing or invalid.");
    throw new Error(`TMDB request failed (HTTP ${response.status}).`);
  }
  return response.json();
}

// TODO HS: Tách các hàm fetchNowPlaying/fetchMovieDetails khi đã hiểu luồng;
// các danh sách trả data.results, còn chi tiết trả một object phim.
