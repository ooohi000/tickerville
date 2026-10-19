package com.usstockmap.server.company;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class SectorConverter implements AttributeConverter<Sector, String> {

    @Override
    public String convertToDatabaseColumn(Sector sector) {
        return sector == null ? null : sector.value();
    }

    @Override
    public Sector convertToEntityAttribute(String value) {
        return value == null ? null : Sector.fromValue(value);
    }
}
