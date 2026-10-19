package com.usstockmap.server.region;

/** 클러스터 지역. 프론트 타입 Region과 같은 모양 (docs/api.md GET /regions) */
public record Region(String id, String label, double lat, double lng, double radiusKm) {}
