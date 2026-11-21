# Reelhouse — tiếp tục phát triển phiên bản TMDB

## 1. Phiên bản đang sử dụng

Trang chủ index.html và trang chi tiết movie.html đã trở lại TMDB. Giữ các phần học sinh đã làm: now showing, trending, top rated, upcoming, tìm kiếm/thể loại, tài khoản, watchlist và bình luận. Chỉ sắp xếp file, tách cấu hình/fetch và chỉnh UI cơ bản.

TMDB cần API key. Giá trị cấu hình có sẵn được giữ trong assets/js/config.js, không chép vào tài liệu. Dùng key do học sinh đăng ký và kiểm tra request trên máy chạy sản phẩm.

## 2. Cấu trúc thống nhất

```text
index.html                    Trang chủ TMDB
movie.html                    Chi tiết TMDB theo ID số
login.html
register.html
assets/
  css/style.css               CSS chung, giữ nền tối/vàng và chỉnh responsive
  js/
    config.js                 TMDB_CONFIG: URL, ảnh, ngôn ngữ, key hiện có
    api.js                    getData(path, extra), fetch dùng chung
    home.js                   Các luồng TMDB đã có, dùng cho index và movie
    login.js                  Logic đăng nhập đã có
    register.js               Logic đăng ký đã có
    legacy-tmdb.js            Bản JS TMDB gốc để đối chiếu, không nạp ở trang chính
```

HTML ở gốc, tài nguyên trong assets. Không tạo lại CSS/JS trùng tên ở gốc. File tham khảo không phải nhánh phải tiếp tục hoàn thiện.

## 3. Cách chạy và thứ tự đọc

1. Dùng VS Code Live Server mở index.html, giữ Internet.
2. Mở assets/js/config.js kiểm tra cấu hình TMDB, không đưa key vào note hoặc ảnh thuyết trình.
3. F12 → Network → tìm request api.themoviedb.org; HTTP 401 cần kiểm tra key, lỗi mạng cần kiểm tra kết nối. Không đánh đồng hai trường hợp.
4. Đọc theo thứ tự: HTML → config.js → api.js → home.js → login.js/register.js.

Hai trang index/movie nạp config → api → home. Không nạp đồng thời home.js và legacy-tmdb.js vì sẽ khai báo hàm/biến và gắn sự kiện trùng.

## 4. Luồng API hiện tại

```text
TMDB_CONFIG
   ↓
getData(path, extra)
   ↓
fetch → kiểm tra HTTP → response.json()
   ↓
hàm tải từng khu vực trong home.js
   ↓
showMovies / featured / chi tiết → DOM
```

Các endpoint được mã hiện tại dùng:

- /movie/now_playing: data.results.
- /trending/movie/week: data.results, sau đó lấy chi tiết phim nổi bật.
- /movie/top_rated và /movie/upcoming: data.results.
- /genre/movie/list: data.genres.
- /search/movie?query=...: data.results.
- /discover/movie?with_genres=...: data.results.
- /movie/{id}?append_to_response=credits: một object phim, có credits.

ID TMDB là số; ảnh dùng đường dẫn poster_path kết hợp IMAGE_URL. vote_average là thang 10.

## 5. Phần đã giữ và phần vừa chỉnh

- Giữ nội dung, bố cục và các hàm TMDB/watchlist/comments đã có.
- Giữ đăng ký/đăng nhập, hash mật khẩu và phiên localStorage của học sinh.
- Giữ cải thiện folder, nhãn form/aria-live và ghi chú tài khoản demo.
- Tách cấu hình/fetch khỏi home.js để học sinh dễ tìm điểm gọi API.
- Chỉnh nhẹ nav/card, chữ dài, bố cục chi tiết/mobile và focus bàn phím.

## 6. Hướng làm tiếp — ưu tiên hoàn thiện, không viết lại

### Ưu tiên 1 — Chạy và tự giải thích luồng hiện tại

- [ ] Xác minh key/kết nối trên máy học sinh; chạy các khu vực now showing/trending/top/upcoming.
- [ ] Chỉ được nơi cấu hình, fetch, mảng results và câu lệnh render.
- [ ] Kiểm tra tìm tên, Enter/Search, lọc thể loại và link movie.html?id=...
- [ ] Kiểm tra metadata lịch phát hành theo dữ liệu TMDB; không gọi đây là lịch chiếu/rạp/vé địa phương nếu chưa có dữ liệu đó.

### Ưu tiên 2 — Hoàn thiện trạng thái UI

- [ ] Mỗi khu vực có loading, không dữ liệu, lỗi dễ hiểu và cách thử lại.
- [ ] Giữ nguyên chức năng đã chạy, thêm fallback khi thiếu poster, cast hoặc overview.
- [ ] Phim trending không có kết quả thì không đọc results[0] vô điều kiện.
- [ ] Trang chi tiết xử lý thiếu ID/sai ID/HTTP 404 và không để treo Loading.
- [ ] Chặn kết quả tìm cũ ghi đè kết quả mới khi người dùng tìm liên tiếp.

### Ưu tiên 3 — Storage và tài khoản

- [ ] Đồng nhất helper đọc users/session/watchlist/comments, có try/catch và kiểm tra kiểu dữ liệu.
- [ ] Rà phiên hết hạn, tài khoản không tồn tại và đăng xuất ở mọi trang.
- [ ] Kiểm tra email/username trùng, mật khẩu/xác nhận, ngày sinh và trường trống theo code đã có.
- [ ] Tài khoản là demo phía client dù đã hash; không dùng mật khẩu thật hoặc giới thiệu là xác thực server.
- [ ] Không đổi key đang dùng khi chưa có lý do: users, session, watchlist-{email}, comments-{movieId}.

### Ưu tiên 4 — Watchlist và bình luận

- [ ] Thêm/xóa watchlist không trùng, reload giữ, mỗi user thấy danh sách riêng.
- [ ] Sau thêm/xóa, UI và nút lưu phản ánh đúng dữ liệu storage.
- [ ] Bình luận chặn nội dung chỉ có khoảng trắng, giới hạn độ dài, render text an toàn.
- [ ] Xóa bình luận của chính mình chỉ là giới hạn UI demo; backend mới bảo vệ được quyền thật.

### Ưu tiên 5 — Tách file từng phần khi chức năng ổn định

- [ ] Có thể tách storage.js/auth.js, watchlist.js, comments.js, movie.js từ home.js hiện có.
- [ ] Tách một nhóm rồi chạy lại, không chia toàn bộ cùng lúc chỉ để tăng số file.
- [ ] API/key vẫn tập trung ở config.js/api.js; không copy vào từng trang.
- [ ] Chatbase là phần mở rộng đã có; giữ nếu học sinh tự giải thích được, không để thay thế các phần JS cần học.

## 7. Tự kiểm tra và thuyết trình

- [ ] Desktop và mobile 390px không tràn ngang, poster không méo, nút dễ bấm.
- [ ] Network offline, key không hợp lệ, ID sai và phim thiếu ảnh đều có phản hồi.
- [ ] Đăng ký → đăng nhập → tìm phim → chi tiết → lưu watchlist → bình luận → đăng xuất.
- [ ] Tự trình bày async/await, response.ok, data.results, URLSearchParams và JSON localStorage.

Các kiểm tra mô phỏng giúp phát hiện lỗi code nhưng không thay thế test API live và xem UI trên trình duyệt. Chỉ đánh dấu hoàn thành chức năng đã tự chạy qua.
