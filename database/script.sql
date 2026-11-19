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
    ('Admin', 'admin@studio.com', '$2b$10$M5PWEmejorzjv6ZaPIn1/.bHDrVPU3nk3BlwWB3kxHkc4aIR.m/eG'), 
    ('Laisla', 'laisla@studio.com', '$2b$10$M5PWEmejorzjv6ZaPIn1/.bHDrVPU3nk3BlwWB3kxHkc4aIR.m/eG'),
    ('João Miguel', 'joaomiguel@studio.com', '$2b$10$M5PWEmejorzjv6ZaPIn1/.bHDrVPU3nk3BlwWB3kxHkc4aIR.m/eG');

INSERT INTO clientes(nome, email, cpf, telefone) VALUES 
    ('Giovani', 'giovani@email.com', 'b9332f3140efaf757e4d684975ef3365', '11 11111-1111'), 
    ('Felipe', 'felipe@email.com', 'be4f639df4cd927594a5e3084b540dc1', '11 11111-2222'),
    ('Maria Eduarda', 'mariaeduarda@email.com', '65eea67226931d6bc95e431330183923', '11 11111-3333'),
    ('João Lucas', 'joaolucas@email.com', '13370f44c3b313f35282afe0da469d8b', '11 11111-4444');

INSERT INTO projetos(cliente_id, titulo_tatuagem, descricao) VALUES 
(1, 'Tribal', 'Colo'),
(2, 'Brawl Stars', 'Costas Fechadas'),
(3, 'Sol', 'Atrás da Orelha'),
(4, 'Meia Lua', 'Atrás da Orelha');

INSERT INTO sessoes(usuario_id, projeto_id, data_agendamento) VALUES 
(3, 1, '2026-11-28 02:00:00'),
(3, 2, '2026-11-30 05:00:00'),
(2, 3, '2026-12-02 03:00:00');