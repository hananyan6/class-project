package com.example.product;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.sql.*;
import java.util.*;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {

    private static final String DB_URL =
        "jdbc:sqlite:../server/products.db";

    private static final Path UPLOAD_DIR =
        Paths.get("uploads");

    private Connection connect() throws SQLException {
        Connection conn = DriverManager.getConnection(DB_URL);

        // 既存の商品データを残したまま画像パス列を追加
        try (Statement stmt = conn.createStatement()) {
            boolean exists = false;

            try (ResultSet rs = stmt.executeQuery(
                    "PRAGMA table_info(products)")) {
                while (rs.next()) {
                    if ("image_path".equals(rs.getString("name"))) {
                        exists = true;
                        break;
                    }
                }
            }

            if (!exists) {
                stmt.executeUpdate(
                        "ALTER TABLE products ADD COLUMN image_path TEXT");
            }
        } catch (SQLException e) {
            conn.close();
            throw e;
        }

        return conn;
    }

    @GetMapping
    public List<Map<String, Object>> getProducts() {
        List<Map<String, Object>> products = new ArrayList<>();

        String sql = "SELECT id, name, price, stock, category, image_path FROM products";

        try (Connection conn = connect();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                Map<String, Object> p = new LinkedHashMap<>();
                p.put("id", rs.getInt("id"));
                p.put("name", rs.getString("name"));
                p.put("price", rs.getInt("price"));
                p.put("stock", rs.getInt("stock"));
                p.put("category", rs.getString("category"));
                p.put("imagePath", rs.getString("image_path"));
                products.add(p);
            }

            return products;

        } catch (SQLException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "商品一覧の取得に失敗しました", e);
        }
    }

    // 画像ファイルを保存し、画像のURLを返す
    @PostMapping(value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadImage(
            @RequestParam("image") MultipartFile image) {

        if (image.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "画像を選択してください");
        }

        String contentType = image.getContentType();
        if (contentType == null ||
                !Set.of("image/jpeg", "image/png", "image/gif", "image/webp")
                        .contains(contentType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "JPEG、PNG、GIF、WebP形式の画像を選択してください");
        }

        if (image.getSize() > 5 * 1024 * 1024) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "画像は5MB以下にしてください");
        }

        String originalName = image.getOriginalFilename();
        String extension = "";

        if (originalName != null && originalName.lastIndexOf('.') >= 0) {
            extension = originalName.substring(
                    originalName.lastIndexOf('.')).toLowerCase(Locale.ROOT);
        }

        if (!Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp")
                .contains(extension)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "対応していない画像形式です");
        }

        String fileName = UUID.randomUUID() + extension;

        try {
            Files.createDirectories(UPLOAD_DIR);
            Path destination = UPLOAD_DIR.resolve(fileName).normalize();

            if (!destination.getParent().equals(UPLOAD_DIR.normalize())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "不正なファイル名です");
            }

            image.transferTo(destination);

            Map<String, String> result = new LinkedHashMap<>();
            result.put("imagePath", "/uploads/" + fileName);
            return result;

        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "画像の保存に失敗しました", e);
        }
    }

    @PostMapping
    public Map<String, Object> createProduct(
            @RequestBody Map<String, Object> input) {

        String sql = "INSERT INTO products " +
                "(name, price, stock, category, image_path) VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = connect();
             PreparedStatement stmt = conn.prepareStatement(
                     sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setString(1, String.valueOf(input.get("name")));
            stmt.setInt(2, Integer.parseInt(String.valueOf(input.get("price"))));
            stmt.setInt(3, Integer.parseInt(String.valueOf(input.get("stock"))));
            stmt.setString(4, String.valueOf(input.get("category")));
            stmt.setString(5, (String) input.get("imagePath"));
            stmt.executeUpdate();

            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    Map<String, Object> result = new LinkedHashMap<>(input);
                    result.put("id", keys.getInt(1));
                    return result;
                }
            }

            throw new SQLException("商品IDを取得できませんでした");

        } catch (SQLException | NumberFormatException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "商品の登録に失敗しました", e);
        }
    }

    @PutMapping("/{id}")
    public Map<String, Object> updateProduct(
            @PathVariable int id,
            @RequestBody Map<String, Object> input) {

        String sql = "UPDATE products SET name = ?, price = ?, " +
                "stock = ?, category = ?, image_path = ? WHERE id = ?";

        try (Connection conn = connect();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, String.valueOf(input.get("name")));
            stmt.setInt(2, Integer.parseInt(String.valueOf(input.get("price"))));
            stmt.setInt(3, Integer.parseInt(String.valueOf(input.get("stock"))));
            stmt.setString(4, String.valueOf(input.get("category")));
            stmt.setString(5, (String) input.get("imagePath"));
            stmt.setInt(6, id);

            if (stmt.executeUpdate() == 0) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "商品が見つかりません");
            }

            Map<String, Object> result = new LinkedHashMap<>(input);
            result.put("id", id);
            return result;

        } catch (SQLException | NumberFormatException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "商品の更新に失敗しました", e);
        }
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> deleteProduct(@PathVariable int id) {

        String sql = "DELETE FROM products WHERE id = ?";

        try (Connection conn = connect();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);

            if (stmt.executeUpdate() == 0) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "商品が見つかりません");
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("message", "商品を削除しました");
            result.put("id", id);
            return result;

        } catch (SQLException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "商品の削除に失敗しました", e);
        }
    }
}
