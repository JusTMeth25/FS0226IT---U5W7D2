package com.example.demo.repository;

import com.example.demo.entity.Disco;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DiscoRepository extends JpaRepository<Disco, Long> {

    /** Vetrina pubblica: le bozze non escono mai dal database. */
    List<Disco> findByPubblicatoTrueOrderByTitoloAsc();

    Optional<Disco> findByIdAndPubblicatoTrue(Long id);

    List<Disco> findAllByOrderByTitoloAsc();
}
