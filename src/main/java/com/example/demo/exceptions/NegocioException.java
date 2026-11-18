package com.example.demo.exceptions;

import org.springframework.http.HttpStatus;

// Exceção única para violações de regra de negócio.
// O ApiExceptionHandler transforma em JSON: { status, erro, mensagem }
public class NegocioException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    private final HttpStatus status;

    public NegocioException(HttpStatus status, String mensagem) {
        super(mensagem);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    // 400: dado enviado é inválido (valor negativo, campo vazio...)
    public static NegocioException invalido(String mensagem) {
        return new NegocioException(HttpStatus.BAD_REQUEST, mensagem);
    }

    // 403: usuário autenticado, mas o recurso não é dele
    public static NegocioException proibido(String mensagem) {
        return new NegocioException(HttpStatus.FORBIDDEN, mensagem);
    }

    // 404: recurso não existe
    public static NegocioException naoEncontrado(String mensagem) {
        return new NegocioException(HttpStatus.NOT_FOUND, mensagem);
    }

    // 409: a operação não é permitida no estado atual (ex.: aprovar contrato já assinado)
    public static NegocioException conflito(String mensagem) {
        return new NegocioException(HttpStatus.CONFLICT, mensagem);
    }
}
