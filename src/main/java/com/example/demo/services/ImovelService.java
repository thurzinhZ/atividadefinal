package com.example.demo.services;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.example.demo.DTOs.ImovelFiltroDTO;
import com.example.demo.DTOs.PaginaDTO;
import com.example.demo.exceptions.NegocioException;
import com.example.demo.models.BairroModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.TipoImovelModel;
import com.example.demo.repositories.ImovelRepository;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Nulls;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

@Service
public class ImovelService {
    public static final int TAMANHO_MAXIMO_PAGINA = 50;

    private final ImovelRepository repository;

    public ImovelService(ImovelRepository repository) {
        this.repository = repository;
    }

    public List<ImovelModel> getAll() {
        List<ImovelModel> list = repository.findAll();
        return list;
    }

    public ImovelModel find(Integer id) {
        Optional<ImovelModel> model = repository.findById(id);
        return model.orElse(null);
    }

    public ImovelModel insert(ImovelModel model) {
        return repository.save(model);
    }

    public ImovelModel update(ImovelModel model) {
        try {
            if (find(model.getId()) != null) {
                return repository.save(model);
            }
            return null;
        } catch (Exception e) {
            return null;
        }

    }

    public void delete(Integer id) {
        try {
            repository.deleteById(id);
        } catch (DataIntegrityViolationException e) {
            // chaves estrangeiras de ofertas/contratos impedem apagar o histórico da negociação
            throw NegocioException.conflito("Este imóvel tem ofertas ou contratos e não pode ser excluído. Altere o status para INATIVO.");
        }
    }

    public ImovelModel alterarStatus(Integer id, String status) {
        ImovelModel model = find(id);
        if (model == null) {
            return null;
        }
        model.setStatus(status);
        return repository.save(model);
    }

    // Busca paginada com filtros opcionais.
    // ordem: destaque (padrão) | recentes | menor-preco | maior-preco
    public PaginaDTO<ImovelModel> buscar(ImovelFiltroDTO filtro, int page, int size, String ordem) {
        if (page < 0) {
            throw NegocioException.invalido("A página deve ser maior ou igual a zero.");
        }
        if (size < 1 || size > TAMANHO_MAXIMO_PAGINA) {
            throw NegocioException.invalido("O tamanho da página deve estar entre 1 e " + TAMANHO_MAXIMO_PAGINA + ".");
        }
        if (filtro.precoMin() != null && filtro.precoMax() != null && filtro.precoMin().compareTo(filtro.precoMax()) > 0) {
            throw NegocioException.invalido("O preço mínimo não pode ser maior que o preço máximo.");
        }
        // a ordenação é aplicada dentro da Specification (precisa do preço calculado)
        return PaginaDTO.de(repository.findAll(especificacao(filtro, ordem), PageRequest.of(page, size)));
    }

    static Specification<ImovelModel> especificacao(ImovelFiltroDTO filtro, String ordem) {
        return (root, query, cb) -> {
            List<Predicate> filtros = new ArrayList<>();
            Join<ImovelModel, BairroModel> bairro = root.join("bairro", JoinType.LEFT);
            Join<ImovelModel, TipoImovelModel> tipo = root.join("tipoImovel", JoinType.LEFT);
            Expression<BigDecimal> preco = preco(root, cb);

            if (temTexto(filtro.q())) {
                String termo = "%" + filtro.q().trim().toLowerCase() + "%";
                filtros.add(cb.or(
                        cb.like(cb.lower(root.get("titulo")), termo),
                        cb.like(cb.lower(root.get("endereco")), termo),
                        cb.like(cb.lower(bairro.get("nome")), termo),
                        cb.like(cb.lower(bairro.get("cidade")), termo),
                        cb.like(cb.lower(tipo.get("nome")), termo)));
            }
            if (temTexto(filtro.finalidade())) {
                filtros.add(cb.equal(cb.upper(root.get("finalidade")), filtro.finalidade().trim().toUpperCase()));
            }
            if (filtro.tipoId() != null) {
                filtros.add(cb.equal(tipo.get("id"), filtro.tipoId()));
            }
            if (filtro.bairroId() != null) {
                filtros.add(cb.equal(bairro.get("id"), filtro.bairroId()));
            }
            if (filtro.precoMin() != null) {
                filtros.add(cb.greaterThanOrEqualTo(preco, filtro.precoMin()));
            }
            if (filtro.precoMax() != null) {
                filtros.add(cb.lessThanOrEqualTo(preco, filtro.precoMax()));
            }
            if (filtro.dormitoriosMin() != null) {
                filtros.add(cb.greaterThanOrEqualTo(root.get("dormitorios"), filtro.dormitoriosMin()));
            }
            if (temTexto(filtro.status())) {
                String status = filtro.status().trim().toUpperCase();
                if ("DISPONIVEL".equals(status)) {
                    // imóveis antigos podem estar com status nulo
                    filtros.add(cb.or(cb.isNull(root.get("status")),
                            cb.not(cb.upper(root.get("status")).in("EM_NEGOCIACAO", "VENDIDO", "ALUGADO", "INATIVO"))));
                } else {
                    filtros.add(cb.equal(cb.upper(root.get("status")), status));
                }
            }

            // não ordenar na consulta de contagem da paginação
            if (query != null && !Long.class.equals(query.getResultType()) && !long.class.equals(query.getResultType())) {
                query.orderBy(ordenacao(ordem, root, cb, preco));
            }
            return cb.and(filtros.toArray(new Predicate[0]));
        };
    }

    // preço de referência: aluguel para imóveis de aluguel, venda para os demais
    private static Expression<BigDecimal> preco(Root<ImovelModel> root, CriteriaBuilder cb) {
        return cb.<BigDecimal>selectCase()
                .when(cb.equal(cb.upper(root.get("finalidade")), "ALUGUEL"), root.<BigDecimal>get("precoAluguel"))
                .otherwise(root.<BigDecimal>get("precoVenda"));
    }

    private static List<Order> ordenacao(String ordem, Root<ImovelModel> root, CriteriaBuilder cb, Expression<BigDecimal> preco) {
        List<Order> ordens = new ArrayList<>();
        String chave = ordem == null ? "destaque" : ordem;
        switch (chave) {
            // imóveis sem preço vão para o fim da lista (Nulls.LAST é do JPA 3.2)
            case "menor-preco" -> ordens.add(cb.asc(preco, Nulls.LAST));
            case "maior-preco" -> ordens.add(cb.desc(preco, Nulls.LAST));
            case "recentes" -> {
            }
            default -> ordens.add(cb.desc(root.get("destaque"), Nulls.LAST));
        }
        ordens.add(cb.desc(root.get("id")));
        return ordens;
    }

    private static boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }
}
