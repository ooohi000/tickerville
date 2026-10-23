package com.usstockmap.server.company;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.core.io.ClassPathResource;

/**
 * 지도에 올릴 기업 목록 (resources/companies/universe.csv, 단일 원본).
 * 형식: ticker,sector,name_ko,description_ko,founded_year,founded_note_ko — # 주석, 첫 줄(헤더) 무시. 잘못된 줄이 있으면 앱이 뜨기 전에 실패한다.
 */
public record CompanyUniverse(List<Entry> entries) {

    public static final String RESOURCE = "companies/universe.csv";
    static final String HEADER = "ticker,sector,name_ko,description_ko,founded_year,founded_note_ko";
    /** 설립연도 범위 (시대 테마: 그 해에 없던 기업은 흐리게) */
    static final int MIN_FOUNDED = 1600;
    static final int MAX_FOUNDED = 2100;
    /** "전신 맨해튼 컴퍼니" 같은 짧은 메모 */
    static final int MAX_FOUNDED_NOTE = 20;
    /** 소개는 상세 패널 한 줄 */
    static final int MAX_DESCRIPTION = 80;

    /** foundedYear·foundedNoteKo 는 비어 있으면 null (모르는 기업은 흐리게 하지 않는다) */
    public record Entry(String ticker, Sector sector, String nameKo, String descriptionKo,
                        Integer foundedYear, String foundedNoteKo) {
        public Entry(String ticker, Sector sector, String nameKo, String descriptionKo) {
            this(ticker, sector, nameKo, descriptionKo, null, null);
        }
    }

    public static CompanyUniverse load() {
        try (InputStream in = new ClassPathResource(RESOURCE).getInputStream()) {
            return parse(in);
        } catch (IOException e) {
            throw new UncheckedIOException("cannot read " + RESOURCE, e);
        }
    }

    static CompanyUniverse parse(InputStream in) throws IOException {
        List<Entry> entries = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        boolean headerSeen = false;
        try (BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            int no = 0;
            while ((line = r.readLine()) != null) {
                no++;
                String trimmed = line.strip();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) continue;
                if (!headerSeen) {
                    if (!trimmed.equals(HEADER)) throw invalid(no, "header must be " + HEADER);
                    headerSeen = true;
                    continue;
                }
                String[] cols = trimmed.split(",", -1);
                if (cols.length != 6) throw invalid(no, "expected 6 columns (no commas in description)");
                String ticker = cols[0].strip();
                if (!ticker.matches("[A-Z][A-Z0-9.-]{0,9}")) throw invalid(no, "bad ticker " + ticker);
                if (!seen.add(ticker)) throw invalid(no, "duplicate ticker " + ticker);
                Sector sector;
                try {
                    sector = Sector.fromValue(cols[1].strip());
                } catch (IllegalArgumentException e) {
                    throw invalid(no, e.getMessage());
                }
                String nameKo = cols[2].strip();
                String description = cols[3].strip();
                if (nameKo.isEmpty() || nameKo.length() > 100) throw invalid(no, "name_ko must be 1..100 chars");
                if (description.isEmpty() || description.length() > MAX_DESCRIPTION) {
                    throw invalid(no, "description_ko must be 1.." + MAX_DESCRIPTION + " chars");
                }
                Integer founded = null;
                String foundedYear = cols[4].strip();
                if (!foundedYear.isEmpty()) {
                    if (!foundedYear.matches("[0-9]{4}")) throw invalid(no, "founded_year must be 4 digits");
                    founded = Integer.parseInt(foundedYear);
                    if (founded < MIN_FOUNDED || founded > MAX_FOUNDED) {
                        throw invalid(no, "founded_year must be " + MIN_FOUNDED + ".." + MAX_FOUNDED);
                    }
                }
                String note = cols[5].strip();
                if (note.length() > MAX_FOUNDED_NOTE) throw invalid(no, "founded_note_ko must be <= " + MAX_FOUNDED_NOTE + " chars");
                if (!note.isEmpty() && founded == null) throw invalid(no, "founded_note_ko needs founded_year");
                entries.add(new Entry(ticker, sector, nameKo, description, founded, note.isEmpty() ? null : note));
            }
        }
        if (!headerSeen) throw new IllegalStateException(RESOURCE + ": missing header");
        return new CompanyUniverse(List.copyOf(entries));
    }

    private static IllegalStateException invalid(int line, String why) {
        return new IllegalStateException(RESOURCE + " line " + line + ": " + why);
    }
}
