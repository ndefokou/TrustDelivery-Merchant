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

    // Convert to search results
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

    // If we don't have enough results, add mock suggestions for Yaoundé
    if results.len() < limit as usize {
        let mock_addresses = get_mock_yaounde_addresses(query);
        for mock in mock_addresses {
            if results.len() >= limit as usize {
                break;
            }
            // Check if this address is already in results
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
        ("Centre Ville Place de l'Étoile", 3.8625, 11.5167, "Centre Ville"),
        ("Mvan Carrefour", 3.8456, 11.5023, "Mvan"),
        ("Mvog-Mbi Carrefour", 3.8567, 11.4987, "Mvog-Mbi"),
        ("Nlongkak Carrefour", 3.8712, 11.4890, "Nlongkak"),
        ("Messa Carrefour", 3.8645, 11.4789, "Messa"),
        ("Odza Carrefour", 3.8234, 11.5123, "Odza"),
        ("Mvolyé Carrefour", 3.8567, 11.5234, "Mvolyé"),
        ("Etoudi Carrefour", 3.8901, 11.5345, "Etoudi"),
        ("Ngoa-Ekelle Carrefour", 3.8456, 11.4876, "Ngoa-Ekelle"),
        ("Briqueterie Carrefour", 3.8678, 11.4923, "Briqueterie"),
        ("Mfoundi Carrefour", 3.8789, 11.5067, "Mfoundi"),
        ("Tsinga Carrefour", 3.8567, 11.5234, "Tsinga"),
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