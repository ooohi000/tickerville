package com.usstockmap.server.company;

import com.usstockmap.server.financial.FinancialStatementResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/companies")
public class CompanyController {

    private final CompanyService service;
    private final CompanyDetailService detail;

    public CompanyController(CompanyService service, CompanyDetailService detail) {
        this.service = service;
        this.detail = detail;
    }

    @GetMapping
    public CompanyDatasetResponse companies() {
        return service.getMapDataset();
    }

    @GetMapping("/{ticker}")
    public CompanyDetailResponse company(@PathVariable("ticker") String ticker) {
        return detail.get(ticker);
    }

    /** period = quarterly(기본) | annual, limit = 1~40 (기본 8) */
    @GetMapping("/{ticker}/financials")
    public List<FinancialStatementResponse> financials(
            @PathVariable("ticker") String ticker,
            @RequestParam(name = "period", defaultValue = "quarterly") String period,
            @RequestParam(name = "limit", defaultValue = "8") int limit) {
        return detail.financials(ticker, period, limit);
    }
}
