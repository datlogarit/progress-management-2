---
name: java-spring-boot-standard
description: Chuẩn code, kiến trúc, và quy ước cho dự án backend Java Spring Boot doanh nghiệp (enterprise), dùng Spring Data JPA làm persistence layer. Dùng skill này bất cứ khi nào người dùng viết, review, refactor, hoặc thiết kế code Spring Boot — bao gồm Controller/REST API, Service, Repository (JPA), DTO/Entity, exception handling, validation, transaction, logging, testing, hoặc cấu trúc package/module. Cũng áp dụng khi người dùng hỏi "nên tổ chức code thế nào", "convention chuẩn là gì", "review code Spring Boot của tôi", hoặc khi tạo mới một dự án/feature Spring Boot từ đầu. Ưu tiên dùng skill này ngay cả khi người dùng không nói rõ từ "chuẩn" hay "convention" — chỉ cần đang làm việc với code Java Spring Boot backend là nên tham khảo.
---

# Java Spring Boot Backend Standard

Bộ quy ước kiến trúc và coding convention cho dự án backend Java Spring Boot cấp doanh nghiệp — dùng làm kim chỉ nam khi viết mới, review, hoặc refactor code.

## Khi nào dùng skill này

- Viết mới Controller, Service, Repository (JPA), DTO, Entity, Exception, Config
- Thiết kế REST API (endpoint, request/response, mã lỗi)
- Review code Java Spring Boot đã có, chỉ ra chỗ sai convention
- Quyết định cấu trúc package/module cho dự án mới hoặc feature mới
- Xử lý transaction, validation, exception, logging trong Spring Boot
- Viết unit test / integration test cho các layer trên

Chi tiết về JPA/Hibernate → `references/jpa.md`. Chi tiết về testing → `references/testing.md`.

## 1. Cấu trúc package (layer-first)

Chuẩn mặc định là tổ chức theo **layer** (không theo feature), vì dễ scan và là convention phổ biến nhất trong codebase doanh nghiệp Java:

```
com.company.project
├── controller/          # REST endpoints, không chứa business logic
├── service/
│   ├── impl/            # Implementation của interface service
├── repository/          # Spring Data JPA interfaces
├── mapper/              # MapStruct mapper (DTO <-> Entity), không phải MyBatis
├── dto/
│   ├── request/
│   └── response/
├── entity/              # JPA @Entity hoặc domain model
├── exception/           # Custom exception + GlobalExceptionHandler
├── config/              # @Configuration classes
├── util/
├── validator/           # Custom validator nếu cần
└── constant/            # Enum, hằng số
```

Nếu dự án lớn (nhiều bounded context), có thể tổ chức theo **feature-first** (`order/`, `payment/`, mỗi package tự có controller/service/repository con). Chỉ đề xuất khi dự án thực sự lớn — mặc định vẫn là layer-first vì đơn giản hơn để bắt đầu.

## 2. Naming convention

| Thành phần        | Quy ước                         | Ví dụ                                                                                          |
| ----------------- | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| Class             | PascalCase, hậu tố theo vai trò | `UserController`, `UserService`, `UserServiceImpl`, `UserRepository`, `UserMapper` (MapStruct) |
| Interface service | Không tiền tố `I`               | `UserService` (không phải `IUserService`)                                                      |
| DTO request       | Hậu tố `Request`                | `CreateUserRequest`, `UpdateUserRequest`                                                       |
| DTO response      | Hậu tố `Response` hoặc `Dto`    | `UserResponse`, `UserDto`                                                                      |
| Entity            | Danh từ số ít, khớp tên bảng    | `User`, `OrderItem`                                                                            |
| Method REST       | Động từ rõ hành động            | `getUserById`, `createUser`, `deleteUser` — tránh tên mơ hồ như `process`, `handle`            |
| Package           | Chữ thường, không gạch dưới     | `com.company.project.service`                                                                  |
| Hằng số           | UPPER_SNAKE_CASE                | `MAX_RETRY_COUNT`                                                                              |
| Biến/tham số      | camelCase, tên có nghĩa         | tránh `data`, `obj`, `temp`                                                                    |

## 3. Controller layer

- Controller **chỉ** điều phối: nhận request → gọi service → trả response. Không viết business logic hay truy vấn DB trong controller.
- Luôn dùng `@RestController` + `@RequestMapping("/api/v1/...")` — có version trong path.
- Input validate bằng Bean Validation (`@Valid` + annotation trên DTO: `@NotNull`, `@Size`, `@Email`...), không validate thủ công bằng if-else trong controller.
- Trả về `ResponseEntity<T>` với status code rõ ràng (`200 OK`, `201 Created` kèm `Location` header, `204 No Content` khi xóa, `400/404/409` cho lỗi nghiệp vụ).
- DTO tách biệt hoàn toàn khỏi Entity — không bao giờ trả Entity trực tiếp ra API (rò rỉ cấu trúc DB, vấn đề lazy-loading, khó version hóa API).

### 3.1. Tổ chức Controller theo Entity (ưu tiên mặc định)

- **Ưu tiên tạo một Controller riêng cho mỗi Entity/aggregate root chính** trong domain (ví dụ: `User` → `UserController`, `Order` → `OrderController`, `Product` → `ProductController`), thay vì gom nhiều entity không liên quan vào chung một controller lớn.
- Tên Controller và base path phải khớp trực tiếp với Entity mà nó quản lý: `UserController` ↔ `@RequestMapping("/api/v1/users")`, `OrderController` ↔ `@RequestMapping("/api/v1/orders")`.
- Endpoint được phân bổ vào Controller dựa trên **entity mà endpoint đó thao tác chính (chủ thể chính của response/URL)**, không dựa theo màn hình UI hay theo tính năng chung chung. Ví dụ: endpoint lấy danh sách đơn hàng của một user (`GET /api/v1/users/{userId}/orders`) vẫn có thể đặt ở `OrderController` (vì response trả về là `Order`), dùng `userId` như path param lọc, thay vì nhét vào `UserController`.
- Với entity con phụ thuộc chặt vào entity cha (ví dụ `OrderItem` chỉ tồn tại trong ngữ cảnh của `Order`, không có vòng đời độc lập), có thể gộp endpoint quản lý entity con vào chung Controller của entity cha dưới dạng nested path (`/api/v1/orders/{orderId}/items`) thay vì tạo controller riêng — tránh tạo controller quá nhỏ, rời rạc.
- Không tạo một Controller "tổng hợp" (ví dụ `ApiController`, `CommonController`, `MainController`) chứa endpoint của nhiều entity không liên quan — vi phạm nguyên tắc single responsibility, khó maintain và khó review về sau.
- Nếu một nghiệp vụ cần orchestration nhiều entity (ví dụ "checkout" động chạm `Order`, `Payment`, `Inventory`), cân nhắc tạo controller riêng theo **use case** (`CheckoutController`) thay vì gán bừa vào một trong các entity controller — nhưng đây là ngoại lệ, không phải mặc định, và logic orchestration vẫn phải nằm ở service layer, controller chỉ gọi xuống.
- Khi review code, nếu phát hiện một Controller có endpoint thao tác trên nhiều entity không liên quan hệ cha-con, đề xuất tách thành các Controller riêng theo entity tương ứng.

```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
}
```

## 4. Service layer

- Interface + implementation tách riêng (`UserService` + `UserServiceImpl`) — chuẩn phổ biến trong enterprise Java để dễ mock/test và đổi implementation. (Với team nhỏ ưu tiên tốc độ, có thể bỏ interface nếu người dùng nói rõ muốn đơn giản hóa — nhưng mặc định vẫn giữ interface.)
- `@Transactional` đặt ở method của service, không đặt ở controller hay repository.
  - Đọc dữ liệu: `@Transactional(readOnly = true)` để tối ưu.
  - Ghi dữ liệu: `@Transactional` mặc định (rollback khi gặp `RuntimeException`/`Error`; nếu cần rollback cả checked exception, khai báo `rollbackFor = Exception.class`).
- Business logic, orchestration nhiều repository/mapper thuộc về đây, không đẩy xuống controller hay lên repository.
- Dùng constructor injection (qua Lombok `@RequiredArgsConstructor` với field `final`), tuyệt đối tránh `@Autowired` trên field — khó test, che giấu dependency.

```java
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper; // MapStruct mapper cho DTO <-> Entity

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + request.getEmail());
        }
        User user = userMapper.toEntity(request);
        User saved = userRepository.save(user);
        return userMapper.toResponse(saved);
    }
}
```

## 5. Exception handling

- Định nghĩa custom exception có phân cấp rõ ràng, kế thừa `RuntimeException` (tránh checked exception làm bẩn signature):
  - `ResourceNotFoundException`, `DuplicateResourceException`, `BusinessRuleViolationException`, `UnauthorizedException`...
- Xử lý tập trung bằng `@RestControllerAdvice` + `@ExceptionHandler`, không dùng try-catch rải rác trong controller.
- Response lỗi có format thống nhất toàn hệ thống:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.of("RESOURCE_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        // gom lỗi field validation vào ErrorResponse.details
        ...
    }
}
```

`ErrorResponse` chuẩn nên có: `code` (mã lỗi định danh, không phải HTTP status), `message`, `timestamp`, `details` (list lỗi field nếu có). Không bao giờ trả stack trace hay message lỗi DB thô ra ngoài client.

## 6. Persistence layer

Persistence layer dùng **Spring Data JPA / Hibernate**. Chi tiết đầy đủ (entity convention, lazy loading, N+1, open-in-view, migration) → `references/jpa.md`.

Nguyên tắc chung: **repository chỉ chứa truy vấn dữ liệu, không chứa business logic**.

## 7. Cấu hình (Configuration)

- Tách theo profile: `application.yml` (base) + `application-dev.yml`, `application-staging.yml`, `application-prod.yml`. Kích hoạt qua `SPRING_PROFILES_ACTIVE`.
- Secret (DB password, API key) **không** hardcode trong file yml commit lên git — dùng biến môi trường hoặc secret manager (Vault, AWS Secrets Manager...), tham chiếu bằng `${DB_PASSWORD}`.
- Dùng `@ConfigurationProperties` cho nhóm config liên quan thay vì rải `@Value` khắp nơi:

```java
@ConfigurationProperties(prefix = "app.mail")
@Getter @Setter
public class MailProperties {
    private String host;
    private int port;
}
```

## 8. Logging

- Dùng SLF4J qua annotation Lombok `@Slf4j` trên class (tự sinh field `log`), không tự khai báo `private static final Logger log = LoggerFactory.getLogger(X.class)` thủ công.
- Không dùng `System.out.println`.
- Log ở service layer khi có hành động nghiệp vụ quan trọng hoặc lỗi; không log lặp lại cùng một sự kiện ở nhiều layer.
- Level: `ERROR` cho lỗi hệ thống cần chú ý, `WARN` cho tình huống bất thường nhưng không crash, `INFO` cho sự kiện nghiệp vụ chính (tạo đơn hàng, đăng nhập...), `DEBUG` cho chi tiết kỹ thuật lúc dev.
- Không log thông tin nhạy cảm (password, token, số thẻ, dữ liệu cá nhân).
- Dùng parameterized logging (`log.info("User {} created", userId)`), không nối chuỗi thủ công (`log.info("User " + userId + " created")`) — tránh tốn chi phí string concat khi level bị tắt.

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    @Override
    public UserResponse createUser(CreateUserRequest request) {
        log.info("Creating user with email {}", request.getEmail());
        ...
    }
}
```

## 9. DTO ↔ Entity mapping

- Ưu tiên **MapStruct** cho mapping tự động, type-safe, generate lúc compile (nhanh hơn reflection-based như ModelMapper).
- Không map thủ công từng field nếu số field nhiều — dễ sót và khó maintain.

## 10. Testing

- Unit test cho Service layer bằng JUnit 5 + Mockito, mock hết dependency (repository, mapper, external client).
- Integration test cho Controller/Repository bằng `@SpringBootTest` + Testcontainers (DB thật trong container, không dùng H2 nếu prod dùng PostgreSQL/MySQL — tránh lệch hành vi SQL).
- Đặt tên test method theo pattern `methodName_condition_expectedResult`, ví dụ `createUser_whenEmailExists_throwsDuplicateResourceException`.
- Chi tiết setup Testcontainers, test slice (`@WebMvcTest`, `@DataJpaTest`) → `references/testing.md`.

## 11. Bảo mật cơ bản

- Spring Security cho authentication/authorization, JWT cho stateless API.
- Không bao giờ trả password/hash ra response DTO.
- Validate và sanitize input ở boundary (DTO validation) — không tin dữ liệu từ client.
- Với `@Query` JPQL/native query: luôn dùng named/positional parameter (`:param`, `?1`), không nối chuỗi SQL trực tiếp từ input người dùng — tránh SQL injection.

## 12. Khi review code

Khi được yêu cầu review, kiểm tra theo thứ tự ưu tiên:

1. Business logic có nằm sai layer không (trong controller/repository)?
2. Có transaction boundary đúng chỗ không?
3. Exception có được xử lý tập trung, có rò rỉ thông tin nhạy cảm không?
4. Entity có bị expose trực tiếp ra API không?
5. Validation input có đầy đủ không?
6. Naming có rõ nghĩa, nhất quán không?
7. SQL injection risk (native query/JPQL nối chuỗi trực tiếp từ input)?
8. Có unit test cho logic quan trọng không?
9. Controller có được tổ chức đúng theo entity không (xem mục 3.1) — có controller nào gộp nhiều entity không liên quan, hoặc endpoint đặt sai controller không?

Chỉ ra vấn đề cụ thể kèm dòng/đoạn code, đề xuất sửa theo convention ở trên — không chỉ nói chung chung "chưa chuẩn".
