package com.example.product;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Map;

import at.favre.lib.crypto.bcrypt.BCrypt;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private static final String DB_URL =
    "jdbc:sqlite:../server/products.db";

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
            @RequestBody Map<String, String> request) {

        String userId = request.get("userId");
        String password = request.get("password");

        if (userId == null || userId.isBlank()
                || password == null || password.isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("message",
                    "ログインIDとパスワードを入力してください"));
        }

        String sql =
            "SELECT password_hash FROM users WHERE user_id = ?";

        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, userId);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()
                         && BCrypt.verifyer()
                            .verify(
                                 password.toCharArray(),
                                 rs.getString("password_hash")
                            ).verified) {
                    return ResponseEntity.ok(
                        Map.of("message", "ログインに成功しました"));
                }
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message",
                    "ログインIDまたはパスワードが違います"));

        } catch (Exception e) {
            System.err.println("ログイン処理でエラーが発生しました");
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "ログイン処理に失敗しました"));
        }
    }
}
