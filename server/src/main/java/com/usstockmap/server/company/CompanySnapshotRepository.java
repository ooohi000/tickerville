package com.usstockmap.server.company;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CompanySnapshotRepository extends JpaRepository<CompanySnapshot, Long> {

    /** 지도 전체 목록용. 기업까지 한 번에 가져온다 (N+1 방지). */
    @Query("select s from CompanySnapshot s join fetch s.company c order by c.ticker")
    List<CompanySnapshot> findAllWithCompany();
}
