package com.usstockmap.server.admin;

import com.usstockmap.server.collector.sec.CompanyTickersParser;
import com.usstockmap.server.collector.sec.SecClient;
import com.usstockmap.server.collector.sec.SecSyncResult;
import com.usstockmap.server.company.Company;
import com.usstockmap.server.company.CompanyRepository;
import com.usstockmap.server.company.CompanyUniverse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * universe.csv → DB 기업 목록 맞추기. SEC 전체 수집 직전에 돈다.
 * - 없는 티커: 등록 (SEC 이름·본사 → 좌표). SEC 티커 목록은 새 티커가 있을 때만 한 번 받는다.
 * - 있는 티커: 업종·한글 이름·소개·설립연도를 파일 값으로 (바뀐 것만 저장)
 * - 파일에 없는 기업은 건드리지 않는다 (관리자 API 로 따로 등록한 기업)
 * 한 기업이 실패해도 나머지는 계속한다.
 */
@Service
public class CompanyUniverseSync {

    private static final Logger log = LoggerFactory.getLogger(CompanyUniverseSync.class);

    public record Result(List<String> registered, int updated, List<SecSyncResult.Failure> failed) {
    }

    private final CompanyUniverse universe;
    private final CompanyRepository companies;
    private final CompanyRegistrationService registration;
    private final SecClient sec;

    public CompanyUniverseSync(CompanyUniverse universe, CompanyRepository companies,
                               CompanyRegistrationService registration, SecClient sec) {
        this.universe = universe;
        this.companies = companies;
        this.registration = registration;
        this.sec = sec;
    }

    public Result apply() {
        List<String> registered = new ArrayList<>();
        List<SecSyncResult.Failure> failed = new ArrayList<>();
        int updated = 0;
        Map<String, String> tickerToCik = null;

        for (CompanyUniverse.Entry e : universe.entries()) {
            try {
                Company c = companies.findByTicker(e.ticker()).orElse(null);
                if (c == null) {
                    if (tickerToCik == null) {
                        tickerToCik = CompanyTickersParser.parse(sec.companyTickers());
                    }
                    registration.register(new CompanyRegistrationService.Request(e.ticker(), e.nameKo(),
                            e.sector().value()), tickerToCik);
                    c = companies.findByTicker(e.ticker()).orElseThrow();
                    registered.add(e.ticker());
                }
                if (applyManagedFields(c, e)) {
                    companies.save(c);
                    updated++;
                }
            } catch (RuntimeException ex) {
                log.warn("universe: {} failed: {}", e.ticker(), ex.toString());
                failed.add(new SecSyncResult.Failure(e.ticker(), "등록 실패: " + ex.getMessage()));
            }
        }
        log.info("universe: {} entries, {} registered, {} updated, {} failed",
                universe.entries().size(), registered.size(), updated, failed.size());
        return new Result(registered, updated, failed);
    }

    /** 직접 관리하는 값(업종·한글 이름·소개·설립연도)을 파일 값으로. 바뀌었으면 true */
    static boolean applyManagedFields(Company c, CompanyUniverse.Entry e) {
        boolean changed = false;
        if (c.getSector() != e.sector()) {
            c.changeSector(e.sector());
            changed = true;
        }
        if (!Objects.equals(c.getNameKo(), e.nameKo())) {
            c.changeNameKo(e.nameKo());
            changed = true;
        }
        if (!Objects.equals(c.getDescriptionKo(), e.descriptionKo())) {
            c.changeDescriptionKo(e.descriptionKo());
            changed = true;
        }
        if (!Objects.equals(c.getFoundedYear(), e.foundedYear()) || !Objects.equals(c.getFoundedNoteKo(), e.foundedNoteKo())) {
            c.changeFounded(e.foundedYear(), e.foundedNoteKo());
            changed = true;
        }
        return changed;
    }
}
