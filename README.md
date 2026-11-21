# 🏖️ Beach Monitor

> Aplicativo web para monitoramento completo de praias em tempo real — maré, ondas, temperatura da água e previsão do tempo.

![Beach Monitor Screenshot](./assets/screenshot.png)

---

## 🌊 Funcionalidades

| Recurso | Descrição |
|---|---|
| 🔍 **Geocoding** | Converte o nome da praia em latitude/longitude via OpenStreetMap Nominatim |
| 🌊 **Dados Marinhos** | Altura, período e direção das ondas, temperatura da água, corrente oceânica |
| 🌡️ **Previsão do Tempo** | Temperatura do ar, sensação térmica, umidade, vento, rajadas, UV Index, pressão |
| 🌊 **Maré** | Estimativa do nível do mar com classificação (alta/baixa/subindo/baixando) |
| 📅 **Previsão 7 Dias** | Ícone de clima, temperaturas máx/mín, probabilidade de chuva e altura de ondas |
| ⏱️ **Ondas Horárias** | Grade deslizável com previsão horária de ondas para as próximas 24h |
| 🏖️ **Avaliação Geral** | Score automático das condições da praia para banho/surf/passeio |
| ✨ **Autocomplete** | Sugestões de localização enquanto você digita |
| ⭐ **Praias Rápidas** | Acesso a praias populares com um clique |

---

## 🛠️ APIs Utilizadas

Todas as APIs são **gratuitas e não requerem cadastro ou API key**.

### 1. [Nominatim — OpenStreetMap](https://nominatim.openstreetmap.org/)
- **Uso:** Geocoding — converte nome de praia → latitude/longitude
- **Endpoint:** `https://nominatim.openstreetmap.org/search`
- **Limite:** Máximo 1 req/segundo (uso razoável)

### 2. [Open-Meteo Forecast API](https://open-meteo.com/)
- **Uso:** Previsão do tempo atual e para 7 dias
- **Dados:** Temperatura, umidade, vento, pressão, UV Index, visibilidade, código WMO
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`

### 3. [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api)
- **Uso:** Dados marinhos — ondas, maré, temperatura da água
- **Dados:** Altura/período/direção das ondas, temperatura superficial do mar, corrente oceânica
- **Endpoint:** `https://marine-api.open-meteo.com/v1/marine`

---

## 🚀 Como Executar

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado **OU** qualquer servidor HTTP estático

### Opção 1 — npx serve (recomendado)
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/beach-monitor.git
cd beach-monitor

# Execute com npx serve
npx serve .
```
Acesse: **http://localhost:3000**

### Opção 2 — http-server
```bash
# Instale globalmente
npm install -g http-server

# Execute
http-server . -p 8080
```
Acesse: **http://localhost:8080**

### Opção 3 — Python (sem Node.js)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Acesse: **http://localhost:8000**

### Opção 4 — Live Server (VS Code)
Instale a extensão **Live Server** no VS Code e clique em **Go Live**.

> ⚠️ **Não abra `index.html` diretamente** como arquivo (`file://...`).  
> As chamadas à API precisam de um servidor HTTP para funcionar corretamente pelo CORS.

---

## 📁 Estrutura do Projeto

```
beach-monitor/
├── index.html          # Estrutura HTML do aplicativo
├── css/
│   └── style.css       # Estilos (tema ocean dark)
├── js/
│   └── app.js          # Lógica: geocoding, APIs, renderização
├── assets/             # Imagens e recursos estáticos
├── .gitignore
└── README.md
```

---

## 🌐 Deploy

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### Netlify
Arraste a pasta `beach-monitor/` para [app.netlify.com/drop](https://app.netlify.com/drop).

### GitHub Pages
1. Faça push para o repositório GitHub
2. Vá em **Settings → Pages**
3. Selecione branch `main` e pasta `/root`
4. Acesse `https://seu-usuario.github.io/beach-monitor`

---

## 📸 Exemplo de Uso

1. Digite `Praia de Copacabana` no campo de busca
2. Clique em **Monitorar** ou pressione Enter
3. Visualize todas as condições em tempo real

---

## 🔧 Tecnologias

- **HTML5** — Estrutura semântica
- **CSS3** — Custom Properties, Grid, Flexbox, animações
- **JavaScript (ES2021)** — Async/await, Fetch API, DOM puro (sem framework)
- **Google Fonts** — Inter + Poppins

---

## 📄 Licença

MIT © 2024 — Livre para uso pessoal e comercial.

---

## 🤝 Contribuindo

1. Fork este repositório
2. Crie uma branch: `git checkout -b minha-feature`
3. Commit: `git commit -m 'feat: adiciona nova funcionalidade'`
4. Push: `git push origin minha-feature`
5. Abra um Pull Request
