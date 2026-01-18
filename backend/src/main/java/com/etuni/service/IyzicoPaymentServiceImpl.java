package com.etuni.service;

import com.etuni.model.Event;
import com.etuni.model.UserEntity;
import com.etuni.repository.EventRepository;
import com.etuni.repository.UserRepository;
import com.iyzipay.Options;
import com.iyzipay.model.*;
import com.iyzipay.request.CreateCheckoutFormInitializeRequest;
import com.iyzipay.request.RetrieveCheckoutFormRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Primary
public class IyzicoPaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(IyzicoPaymentServiceImpl.class);

    private final UserRepository userRepo;
    private final EventRepository eventRepo;

    @Value("${iyzico.api.key:}")
    private String apiKey;

    @Value("${iyzico.api.secret:}")
    private String apiSecret;

    @Value("${iyzico.api.baseurl:https://sandbox-api.iyzipay.com}")
    private String baseUrl;

    @Value("${api.url:http://localhost:8080}")
    private String appApiUrl;

    public IyzicoPaymentServiceImpl(UserRepository userRepo, EventRepository eventRepo) {
        this.userRepo = userRepo;
        this.eventRepo = eventRepo;
    }

    private Options getOptions() {
        Options options = new Options();
        // Hardcoded for debugging
        options.setApiKey("sandbox-81RXLy5N6aIBH7MK1RlyUvRKX5ltAckZ");
        options.setSecretKey("sandbox-3JIDzvswVBPEGEOvVfVb32d34Y4K3oKk");
        options.setBaseUrl("https://sandbox-api.iyzipay.com");
        return options;
    }

    @Override
    public PaymentInitiationResponse initiatePayment(Long eventId, Long userId, BigDecimal amount) {
        // Debug Config
        log.info("Iyzico Config Check - BaseURL: {}", baseUrl);
        log.info("Iyzico Config Check - API Key: {}",
                apiKey != null && apiKey.length() > 10 ? apiKey.trim().substring(0, 10) + "..." : apiKey);
        log.info("Iyzico Config Check - Secret Key: {}",
                apiSecret != null && apiSecret.length() > 10 ? apiSecret.trim().substring(0, 10) + "..." : apiSecret);

        // Debug Connectivity & Credentials
        try {
            com.iyzipay.model.ApiTest apiTest = com.iyzipay.model.ApiTest.retrieve(getOptions());
            log.info("Iyzico ApiTest Result: Status={} Error={}", apiTest.getStatus(), apiTest.getErrorMessage());
        } catch (Exception e) {
            log.error("Iyzico ApiTest Connection Failed", e);
        }

        // Check if iyzico credentials are configured
        if (apiKey == null || apiKey.trim().isEmpty() || apiSecret == null || apiSecret.trim().isEmpty()) {
            log.warn("Iyzico payment attempted but credentials are not configured");
            return new PaymentInitiationResponse(null, null, false,
                    "Payment service is not configured. Please contact support.");
        }

        try {
            UserEntity user = userRepo.findById(userId)
                    .orElseThrow(() -> new RuntimeException("USER_NOT_FOUND"));
            Event event = eventRepo.findById(eventId)
                    .orElseThrow(() -> new RuntimeException("EVENT_NOT_FOUND"));

            String basketId = "B" + UUID.randomUUID().toString().substring(0, 8);

            CreateCheckoutFormInitializeRequest request = new CreateCheckoutFormInitializeRequest();
            request.setLocale(Locale.TR.getValue());
            request.setConversationId(UUID.randomUUID().toString());
            request.setPrice(amount);
            request.setPaidPrice(amount);
            request.setCurrency(Currency.TRY.name());
            request.setBasketId(basketId);
            request.setPaymentGroup(PaymentGroup.PRODUCT.name());
            request.setCallbackUrl(
                    appApiUrl + "/api/payments/iyzico/callback?eventId=" + eventId + "&userId=" + userId);

            Buyer buyer = new Buyer();
            buyer.setId(user.getId().toString());
            buyer.setName(user.getFullName().split(" ")[0]);
            buyer.setSurname(
                    user.getFullName().contains(" ") ? user.getFullName().substring(user.getFullName().indexOf(" ") + 1)
                            : "Soyisim");
            buyer.setGsmNumber("+905350000000");
            buyer.setEmail(user.getEmail());
            buyer.setIdentityNumber("74455555555");
            buyer.setRegistrationAddress("ETUNI Campus");
            buyer.setIp("85.34.78.112"); // Default IP for iyzipay compatibility
            buyer.setCity("Istanbul");
            buyer.setCountry("Turkey");
            buyer.setZipCode("34000");
            request.setBuyer(buyer);

            Address shippingAddress = new Address();
            shippingAddress.setContactName(user.getFullName());
            shippingAddress.setCity("Istanbul");
            shippingAddress.setCountry("Turkey");
            shippingAddress.setAddress("ETUNI Campus");
            shippingAddress.setZipCode("34000");
            request.setShippingAddress(shippingAddress);
            request.setBillingAddress(shippingAddress);

            List<BasketItem> basketItems = new ArrayList<>();
            BasketItem firstBasketItem = new BasketItem();
            firstBasketItem.setId(event.getId().toString());
            firstBasketItem.setName(event.getTitle());
            firstBasketItem.setCategory1("Event Ticket");
            firstBasketItem.setItemType(BasketItemType.VIRTUAL.name());
            firstBasketItem.setPrice(amount);
            basketItems.add(firstBasketItem);
            request.setBasketItems(basketItems);

            CheckoutFormInitialize checkoutFormInitialize = CheckoutFormInitialize.create(request, getOptions());

            if ("success".equals(checkoutFormInitialize.getStatus())) {
                log.info("Iyzico payment initiated: {}", checkoutFormInitialize.getToken());
                return new PaymentInitiationResponse(
                        checkoutFormInitialize.getToken(),
                        checkoutFormInitialize.getPaymentPageUrl(),
                        true,
                        "SUCCESS");
            } else {
                log.error("Iyzico initiation failed: {}", checkoutFormInitialize.getErrorMessage());
                return new PaymentInitiationResponse(null, null, false, checkoutFormInitialize.getErrorMessage());
            }

        } catch (Exception e) {
            log.error("Error initiating Iyzico payment", e);
            return new PaymentInitiationResponse(null, null, false, e.getMessage());
        }
    }

    @Override
    public PaymentVerificationResponse verifyPayment(String token) {
        try {
            com.iyzipay.request.RetrieveCheckoutFormRequest request = new com.iyzipay.request.RetrieveCheckoutFormRequest();
            request.setLocale(Locale.TR.getValue());
            request.setConversationId(UUID.randomUUID().toString());
            request.setToken(token);

            CheckoutForm checkoutForm = CheckoutForm.retrieve(request, getOptions());

            boolean success = "success".equals(checkoutForm.getStatus())
                    && "SUCCESS".equals(checkoutForm.getPaymentStatus());

            return new PaymentVerificationResponse(
                    token,
                    success,
                    checkoutForm.getPaymentStatus(),
                    success ? "SUCCESS" : checkoutForm.getErrorMessage());

        } catch (Exception e) {
            log.error("Error verifying Iyzico payment", e);
            return new PaymentVerificationResponse(token, false, "ERROR", e.getMessage());
        }
    }
}
