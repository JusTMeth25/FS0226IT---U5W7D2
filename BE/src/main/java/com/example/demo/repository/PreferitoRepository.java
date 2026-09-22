package com.example.demo.repository;

import com.example.demo.entity.Preferito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Terzo livello di protezione: ogni query sui preferiti restringe per proprietario.
 * Non esiste un metodo che legga o cancelli un preferito cercandolo per solo id.
 */
public interface PreferitoRepository extends JpaRepository<Preferito, Long> {

    @Query("""
            select p from Preferito p join fetch p.disco d
            where p.utente.id = :utenteId and d.pubblicato = true
            order by p.aggiuntoIl desc
            """)
    List<Preferito> findDelProprietario(@Param("utenteId") Long utenteId);

    @Query("""
            select p from Preferito p join fetch p.disco d
            where p.id = :id and p.utente.id = :utenteId and d.pubblicato = true
            """)
    Optional<Preferito> findByIdDelProprietario(@Param("id") Long id, @Param("utenteId") Long utenteId);

    boolean existsByUtenteIdAndDiscoId(Long utenteId, Long discoId);

    /** Restituisce le righe cancellate: 0 se il preferito non esiste o e' di un altro utente. */
    @Modifying
    @Query("delete from Preferito p where p.id = :id and p.utente.id = :utenteId")
    int deleteByIdDelProprietario(@Param("id") Long id, @Param("utenteId") Long utenteId);

    @Modifying
    @Query("delete from Preferito p where p.disco.id = :discoId")
    int deleteByDiscoId(@Param("discoId") Long discoId);
}
