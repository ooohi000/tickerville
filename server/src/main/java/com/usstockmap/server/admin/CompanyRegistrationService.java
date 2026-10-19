package com.usstockmap.server.admin;

import com.usstockmap.server.collector.sec.CompanyTickersParser;
import com.usstockmap.server.collector.sec.SecClient;
import com.usstockmap.server.collector.sec.SecSubmission;
import com.usstockmap.server.collector.sec.SubmissionsParser;
import com.usstockmap.server.common.api.ApiException;
import com.usstockmap.server.common.geo.AddressNormalizer;
import com.usstockmap.server.common.geo.GeoPoint;
import com.usstockmap.server.common.geo.HqLocator;
import com.usstockmap.server.company.Company;
import com.usstockmap.server.company.CompanyRepository;
import com.usstockmap.server.company.Sector;
import com.usstockmap.server.company.SectorGuess;
import org.springframework.stereotype.Service;

/**
 * 티커 하나로 기업 등록: SEC 에서 이름·본사 주소 → 지도 좌표(인구조사국, 안 되면 우편번호 중심) → 저장.
 * 재무·공시는 등록 후 수집(sec-sync)이 채운다.
 */
@Service
public class CompanyRegistrationService {

    public record Request(String ticker, String nameKo, String sector) {
    }

    public record Registered(String ticker, String name, String nameKo, String sector, String hqCity, String hqState,
                             double lat, double lng, GeoPoint.Precision locationPrecision) {
    }

    private final SecClient sec;
    private final HqLocator locator;
    private final CompanyRepository companies;

    public CompanyRegistrationService(SecClient sec, HqLocator locator, CompanyRepository companies) {
        this.sec = sec;
        this.locator = locator;
        this.companies = companies;
    }

    public Registered register(Request req) {
        if (req == null || req.ticker() == null || req.ticker().isBlank()) {
            throw ApiException.invalid("ticker is required");
        }
        String ticker = req.ticker().trim().toUpperCase();
        if (companies.findByTicker(ticker).isPresent()) {
            throw ApiException.conflict("ticker " + ticker + " already registered");
        }
        String cik = CompanyTickersParser.parse(sec.companyTickers()).get(ticker);
        if (cik == null) {
            throw ApiException.invalid("ticker " + ticker + " not found in SEC");
        }
        SecSubmission s = SubmissionsParser.parse(sec.submissions(cik), ticker);
        SecSubmission.Address a = s.businessAddress();
        if (a.state() == null || a.state().length() != 2 || !a.state().matches("[A-Z]{2}")) {
            throw ApiException.invalid("ticker " + ticker + " has no US headquarters address in SEC (" + a.state() + ")");
        }
        GeoPoint point = locator.locate(a.street(), a.city(), a.state(), a.zip())
                .orElseThrow(() -> ApiException.invalid("could not locate headquarters for " + ticker));
        Sector sector = req.sector() == null || req.sector().isBlank()
                ? SectorGuess.fromSic(s.sicCode())
                : parseSector(req.sector());

        Company c = new Company(ticker, s.name(), sector, AddressNormalizer.titleCase(a.city()), a.state(),
                point.lat(), point.lng());
        c.changeNameKo(blankToNull(req.nameKo()));
        companies.save(c);
        return new Registered(ticker, s.name(), c.getNameKo(), sector.value(), c.getHqCity(), a.state(),
                point.lat(), point.lng(), point.precision());
    }

    private static Sector parseSector(String value) {
        try {
            return Sector.fromValue(value.trim().toLowerCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.invalid("unknown sector: " + value);
        }
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
