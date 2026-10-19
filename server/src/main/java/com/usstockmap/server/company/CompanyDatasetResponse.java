package com.usstockmap.server.company;

import java.time.LocalDate;
import java.util.List;

/** 계약 `CompanyDataset` (web/src/data/companies.json 과 같은 모양). */
public record CompanyDatasetResponse(LocalDate asOf, List<CompanyResponse> companies) {
}
