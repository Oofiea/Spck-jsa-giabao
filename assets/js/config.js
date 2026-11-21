"use strict";

// Cấu hình nguồn chính của Reelhouse: TMDB yêu cầu API key do học sinh đăng ký.
// Giữ giá trị đã có trong project; không chép giá trị key vào tài liệu review.
const TMDB_CONFIG = {
  API_URL: "https://api.themoviedb.org/3",
  IMAGE_URL: "https://image.tmdb.org/t/p/w500",
  LANGUAGE: "en-US",
  API_KEY: "74ae58e0ee28bcdc5dbcb1050aaf6d6a",
};
// TODO HS: Xác nhận key còn dùng được, rồi kiểm tra request ở Network.