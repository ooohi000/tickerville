package com.usstockmap.server.region;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/regions")
public class RegionController {

    private final RegionCatalog catalog;

    public RegionController(RegionCatalog catalog) {
        this.catalog = catalog;
    }

    @GetMapping
    public List<Region> regions() {
        return catalog.all();
    }
}
