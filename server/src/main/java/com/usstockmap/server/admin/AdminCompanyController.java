package com.usstockmap.server.admin;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** 관리자: 티커로 기업 등록 */
@RestController
@RequestMapping("/api/admin/companies")
public class AdminCompanyController {

    private final CompanyRegistrationService registration;

    public AdminCompanyController(CompanyRegistrationService registration) {
        this.registration = registration;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CompanyRegistrationService.Registered register(@RequestBody CompanyRegistrationService.Request request) {
        return registration.register(request);
    }
}
