use sqlx::PgPool;
use uuid::Uuid;
use crate::models::{AddressSearchResult, Address};

pub async fn search_addresses(
    pool: &PgPool,
    query: &str,
    limit: i32,
) -> Result<Vec<AddressSearchResult>, sqlx::Error> {
    // Search in saved addresses
    let saved_addresses = sqlx::query_as::<_, Address>(
        r#"
        SELECT id, address_text, latitude, longitude, area, is_saved, created_at
        FROM addresses
        WHERE is_saved = true AND address_text ILIKE $1
        ORDER BY created_at DESC
        LIMIT $2
        "#
    )
    .bind(format!("%{}%", query))
    .bind(limit as i64)
    .fetch_all(pool)
    .await?;

    // Convert saved addresses to search results
    let mut results: Vec<AddressSearchResult> = saved_addresses
        .into_iter()
        .map(|addr| AddressSearchResult {
            id: Some(addr.id),
            address_text: addr.address_text,
            latitude: addr.latitude,
            longitude: addr.longitude,
            area: addr.area,
            is_saved: true,
        })
        .collect();

    // If not enough results, add mock Yaoundé addresses
    if results.len() < limit as usize {
        let mock_addresses = get_mock_yaounde_addresses(query);
        for mock in mock_addresses {
            if results.len() >= limit as usize {
                break;
            }
            // Avoid duplicates
            if !results.iter().any(|r| r.address_text == mock.address_text) {
                results.push(mock);
            }
        }
    }

    Ok(results)
}

pub async fn get_saved_addresses(
    pool: &PgPool,
    _merchant_id: Uuid,
) -> Result<Vec<Address>, sqlx::Error> {
    let addresses = sqlx::query_as::<_, Address>(
        r#"
        SELECT id, address_text, latitude, longitude, area, is_saved, created_at
        FROM addresses
        WHERE is_saved = true
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(pool)
    .await?;

    Ok(addresses)
}

fn get_mock_yaounde_addresses(query: &str) -> Vec<AddressSearchResult> {
    let all_addresses = vec![
        ("Bastos Carrefour Tradex", 3.8808, 11.5022, "Bastos"),
        ("Bastos Ecobank", 3.8795, 11.5010, "Bastos"),
        ("Bastos Pharmacie", 3.8782, 11.5005, "Bastos"),
        ("Bastos Marché", 3.8765, 11.4988, "Bastos"),
        ("Bastos Camp SIC", 3.8821, 11.5045, "Bastos"),
        ("Centre Ville Place de l'Étoile", 3.8625, 11.5167, "Centre Ville"),
        ("Centre Ville Marché Central", 3.8612, 11.5189, "Centre Ville"),
        ("Centre Ville Pharmacie", 3.8634, 11.5156, "Centre Ville"),
        ("Mvan Carrefour", 3.8456, 11.5023, "Mvan"),
        ("Mvan Marché", 3.8445, 11.5012, "Mvan"),
        ("Mvog-Mbi Carrefour", 3.8567, 11.4987, "Mvog-Mbi"),
        ("Mvog-Mbi Marché", 3.8556, 11.4978, "Mvog-Mbi"),
        ("Nlongkak Carrefour", 3.8712, 11.4890, "Nlongkak"),
        ("Nlongkak Marché", 3.8701, 11.4881, "Nlongkak"),
        ("Messa Carrefour", 3.8645, 11.4789, "Messa"),
        ("Messa Marché", 3.8634, 11.4780, "Messa"),
        ("Odza Carrefour", 3.8234, 11.5123, "Odza"),
        ("Odza Marché", 3.8223, 11.5114, "Odza"),
        ("Mvolyé Carrefour", 3.8567, 11.5234, "Mvolyé"),
        ("Mvolyé Marché", 3.8556, 11.5225, "Mvolyé"),
        ("Etoudi Carrefour", 3.8901, 11.5345, "Etoudi"),
        ("Etoudi Marché", 3.8890, 11.5336, "Etoudi"),
        ("Ngoa-Ekelle Carrefour", 3.8456, 11.4876, "Ngoa-Ekelle"),
        ("Ngoa-Ekelle Université", 3.8467, 11.4865, "Ngoa-Ekelle"),
        ("Briqueterie Carrefour", 3.8678, 11.4923, "Briqueterie"),
        ("Briqueterie Marché", 3.8667, 11.4914, "Briqueterie"),
        ("Mfoundi Carrefour", 3.8789, 11.5067, "Mfoundi"),
        ("Mfoundi Marché", 3.8778, 11.5058, "Mfoundi"),
        ("Tsinga Carrefour", 3.8567, 11.5234, "Tsinga"),
        ("Tsinga Marché", 3.8556, 11.5225, "Tsinga"),
        ("Melen Carrefour", 3.8510, 11.4920, "Melen"),
        ("Melen Marché", 3.8499, 11.4911, "Melen"),
        ("Omnisports Neighborhood", 3.8434, 11.5156, "Omnisports"),
        ("Nkol-Bisson Carrefour", 3.8523, 11.5102, "Nkol-Bisson"),
        ("Nkol-Bisson Marché", 3.8512, 11.5093, "Nkol-Bisson"),
        ("Simbock Carrefour", 3.8345, 11.5089, "Simbock"),
        ("Simbock Marché", 3.8334, 11.5080, "Simbock"),
        ("Ekoumdoum Carrefour", 3.8623, 11.5267, "Ekoumdoum"),
        ("Ekoumdoum Marché", 3.8612, 11.5258, "Ekoumdoum"),
        ("Ekoumdoum Ecole", 3.8634, 11.5278, "Ekoumdoum"),
        ("Quartier Fouda", 3.8790, 11.5101, "Quartier Fouda"),
        ("Brasseries Neighborhood", 3.8834, 11.5078, "Brasseries"),
        ("Nlong Akeneng", 3.8412, 11.5145, "Nlong Akeneng"),
        ("Mvog-Ada Carrefour", 3.8534, 11.4956, "Mvog-Ada"),
        ("Mvog-Ada Marché", 3.8523, 11.4947, "Mvog-Ada"),
        ("Emana Carrefour", 3.8712, 11.5034, "Emana"),
        ("Emana Marché", 3.8701, 11.5025, "Emana"),
        ("Nkom Teki Carrefour", 3.8389, 11.5067, "Nkom Teki"),
        ("Nkom Teki Marché", 3.8378, 11.5058, "Nkom Teki"),
        ("Mvog-Essoka", 3.8445, 11.4978, "Mvog-Essoka"),
        ("Efoulan Carrefour", 3.8378, 11.4989, "Efoulan"),
        ("Efoulan Marché", 3.8367, 11.4980, "Efoulan"),
        ("Mbog-Abang", 3.8589, 11.5123, "Mbog-Abang"),
        ("Mvog-Mbi Mission", 3.8578, 11.4998, "Mvog-Mbi"),
        ("Biyem-Assi Carrefour", 3.8267, 11.4890, "Biyem-Assi"),
        ("Biyem-Assi Marché", 3.8256, 11.4881, "Biyem-Assi"),
        ("Mfandena Carrefour", 3.8634, 11.5123, "Mfandena"),
        ("Mfandena Marché", 3.8623, 11.5114, "Mfandena"),
        ("Ményol Neighborhood", 3.8712, 11.4856, "Ményol"),
        ("Ntougou Neighborhood", 3.8323, 11.5201, "Ntougou"),
        ("Essos Carrefour", 3.8601, 11.5301, "Essos"),
        ("Essos Marché", 3.8590, 11.5292, "Essos"),
        ("Mvog-Betsi", 3.8556, 11.5012, "Mvog-Betsi"),
        ("Nkolemesenges", 3.8489, 11.4923, "Nkolemesenges"),
        ("Mvog-Atangana", 3.8523, 11.4967, "Mvog-Atangana"),
        ("Nkol-Mbongo", 3.8401, 11.5189, "Nkol-Mbongo"),
        ("Mvan-Meyi", 3.8467, 11.5034, "Mvan-Meyi"),
        ("Nlong-Mekung", 3.8434, 11.5167, "Nlong-Mekung"),
        ("Mbalmayo Road", 3.8123, 11.5123, "Mbalmayo Road"),
        ("Obala Road", 3.8789, 11.5378, "Obala Road"),
        ("Mbankolo Carrefour", 3.8612, 11.4867, "Mbankolo"),
        ("Nkol-Ewondo", 3.8545, 11.5101, "Nkol-Ewondo"),
        ("Mvog-Mbi Ophta", 3.8567, 11.5001, "Mvog-Mbi"),
        ("Titi-Gare Neighborhood", 3.8534, 11.5089, "Titi-Gare"),
        ("Ekounou Carrefour", 3.8601, 11.5323, "Ekounou"),
        ("Ekounou Marché", 3.8590, 11.5314, "Ekounou"),
        ("Mfoundi Marché Central", 3.8778, 11.5078, "Mfoundi"),
        ("Nkong-Mondon", 3.8501, 11.4956, "Nkong-Mondon"),
        ("Obili Carrefour", 3.8301, 11.4901, "Obili"),
        ("Obili Marché", 3.8290, 11.4892, "Obili"),
        ("Biteng Neighborhood", 3.8256, 11.4923, "Biteng"),
        ("Mvog-Tsanga", 3.8512, 11.4989, "Mvog-Tsanga"),
        ("Nyom 1 Neighborhood", 3.8212, 11.5101, "Nyom 1"),
        ("Nyom 2 Neighborhood", 3.8201, 11.5090, "Nyom 2"),
        ("Mvog-Ada Prime", 3.8545, 11.4967, "Mvog-Ada"),
    ];

    let query_lower = query.to_lowercase();
    
    all_addresses
        .into_iter()
        .filter(|(text, _, _, _)| text.to_lowercase().contains(&query_lower))
        .map(|(text, lat, lon, area)| AddressSearchResult {
            id: None,
            address_text: text.to_string(),
            latitude: lat,
            longitude: lon,
            area: Some(area.to_string()),
            is_saved: false,
        })
        .collect()
}