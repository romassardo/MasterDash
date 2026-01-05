# Auditoría de Rendimiento y Sugerencias de Indexación (SQL Server DW)

Para garantizar un rendimiento óptimo en un escenario de **Big Data** (millones de registros), se recomienda aplicar los siguientes índices en el DataWarehouse (Staging).

## 1. Tabla: `cajas_ETL_Reporte_Consolidaciones`

### Consultas identificadas:
- Filtrado por `region` y `sucursal` (SafeQuery RLS).
- Agrupación por `SUCURSAL`, `USUARIO`, `CENTRO_COSTOS`, `NOMBRE_COMPLETO`.
- Ordenamiento y paginación por `FECHA`.
- Agrupación temporal por mes sobre `FECHA`.

### Índices Sugeridos:

- **Índice No Agrupado (Paginación y RLS):**
  ```sql
  CREATE INDEX IX_Consolidaciones_Fecha_RLS 
  ON cajas_ETL_Reporte_Consolidaciones (FECHA DESC)
  INCLUDE (SUCURSAL, region);
  ```
  *Beneficio: Optimiza el `OFFSET/FETCH` y el filtrado inicial de seguridad.*

- **Índice de Almacén de Columnas (Recomendado para Big Data):**
  Si la tabla tiene más de 1 millón de filas, un **Clustered Columnstore Index** es la mejor opción para agregaciones masivas (`COUNT`, `SUM`, `DISTINCT`).
  ```sql
  CREATE CLUSTERED COLUMNSTORE INDEX CCI_Consolidaciones 
  ON cajas_ETL_Reporte_Consolidaciones;
  ```
  *Nota: Esto reemplaza la necesidad de la mayoría de los índices tradicionales para analítica.*

---

## 2. Tabla: `[crm].[ETL_Analitica_Uso_CRM]`

### Consultas identificadas:
- Filtrado por `fecha` (Rango de período).
- Agrupación por `OperatorId`, `Nombre`, `Apellido`.
- Agrupaciones temporales diarias sobre `fecha`.
- Cálculos de `SUM` sobre `ConversacionesRecibidasCRM` y `ConversacionesNoRespondidasDesdeCRM`.

### Índices Sugeridos:

- **Índice No Agrupado (Filtro Temporal):**
  ```sql
  CREATE INDEX IX_CRM_Fecha 
  ON [crm].[ETL_Analitica_Uso_CRM] (fecha DESC)
  INCLUDE (OperatorId, ConversacionesRecibidasCRM, ConversacionesNoRespondidasDesdeCRM);
  ```

- **Índice de Almacén de Columnas:**
  Al igual que la tabla anterior, si el volumen es alto, Columnstore es superior para los `SUM` y `GROUP BY`.
  ```sql
  CREATE CLUSTERED COLUMNSTORE INDEX CCI_Uso_CRM 
  ON [crm].[ETL_Analitica_Uso_CRM];
  ```

---

## 3. Recomendaciones Generales de Arquitectura SQL

1. **Evitar Funciones en el WHERE:** 
   En lugar de `WHERE FORMAT(FECHA, 'yyyy-MM') = '2024-12'`, usar comparaciones de rango: `WHERE FECHA >= '2024-12-01' AND FECHA < '2025-01-01'`. Esto permite el uso de índices (**SARGability**).

2. **Estadísticas Actualizadas:**
   Asegurar que las estadísticas de SQL Server se actualicen regularmente para que el optimizador de consultas elija el mejor plan.
   ```sql
   UPDATE STATISTICS cajas_ETL_Reporte_Consolidaciones;
   ```

3. **Vistas Indexadas:**
   Si las consultas de agregación siguen siendo lentas, se pueden crear Vistas Indexadas (Materialized Views) para pre-calcular los totales por Sucursal/Mes.
