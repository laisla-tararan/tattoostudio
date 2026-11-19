CREATE DATABASE tattoo_studio;
USE tattoo_studio;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    cpf VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL
);

CREATE TABLE projetos (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    cliente_id INT NOT NULL,
    titulo_tatuagem VARCHAR(255) NOT NULL,
    descricao VARCHAR(255) NOT NULL,

    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE TABLE sessoes (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    usuario_id INT NOT NULL,
    projeto_id INT NOT NULL,
    data_agendamento DATETIME NOT NULL,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (projeto_id) REFERENCES projetos(id)
);

INSERT INTO usuarios(nome, email, senha) VALUES 
    ('Admin', 'admin@studio.com', '123456'), 
    ('Laisla', 'laisla@studio.com', '123456'),
    ('João Miguel', 'joaomiguel@studio.com', '123456');

INSERT INTO clientes(nome, email, cpf, telefone) VALUES 
    ('Giovani', 'giovani@email.com', '11122233344', '11 11111-1111'), 
    ('Felipe', 'felipe@email.com', '22233344455', '11 11111-2222'),
    ('Maria Eduarda', 'mariaeduarda@email.com', '33344455566', '11 11111-3333'),
    ('João Lucas', 'joaolucas@email.com', '44455566677', '11 11111-4444');

INSERT INTO projetos(cliente_id, titulo_tatuagem, descricao) VALUES 
(1, 'Tribal', 'Colo'),
(2, 'Brawl Stars', 'Costas Fechadas'),
(3, 'Sol', 'Atrás da Orelha'),
(4, 'Meia Lua', 'Atrás da Orelha');

INSERT INTO sessoes(usuario_id, projeto_id, data_agendamento) VALUES 
(3, 1, '2026-11-28 02:00:00'),
(3, 2, '2026-11-30 05:00:00'),
(2, 3, '2026-12-02 03:00:00');