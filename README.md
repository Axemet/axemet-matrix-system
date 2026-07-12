# Orça-Molde - Orçamento de Moldes de Injeção Plástica

Este é um aplicativo web responsivo, de nível de manufatura sênior, projetado para o cálculo e formação de preços de venda de moldes de injeção plástica. Baseado nas especificações exatas de modelagem de chapas e precificação industrial da planilha original, o app oferece uma interface rápida, limpa e auditável.

## 🛠️ Lógica de Cálculo Industrial

O aplicativo calcula custos operacionais, matérias-primas e margens comerciais de maneira transparente:

### 1. Dimensionamento das Chapas Automáticas
A partir das dimensões da largura ($W$) e comprimento ($L$) do molde fornecido, os itens padrão do porta-molde são derivados:
- **P1 e P2 (Placas Cavidade/Macho):** São semi-automáticas. Comprimento e largura recebem folga de $+5\text{ mm}$ ($L+5 \times W+5$). As espessuras são ajustadas manualmente.
- **PBI / PBS (Placas de Fixação Superior/Inferior):** Recebem folga de $+5\text{ mm}$ no comprimento e $+5\text{ mm} + 50\text{ mm}$ ($+55\text{ mm}$) para conformação das orelhas de fixação nas prensas.
- **ESP (Espaçadores):** Comprimento de $L+5$, largura padrão de $50\text{ mm}$, espessura padrão de $100\text{ mm}$.
- **PS (Porta Sanduíche):** Comprimento de $L+5$, largura de $W+5$ e espessura padrão de $31\text{ mm}$.
- **CH EXT (Chapa Extratora):** Comprimento de $L+5$, largura com desconto de $100\text{ mm}$ em relação à placa base e espessura padrão de $16\text{ mm}$.

### 2. Cubagem e Peso do Aço
O cálculo de peso teórico das placas usa a densidade do aço ($7,85\text{ g/cm³}$) ou cobre ($2,25\text{ g/cm³}$):
$$\text{Peso (kg)} = \frac{\text{Comprimento (mm)} \times \text{Largura (mm)} \times \text{Espessura (mm)} \times \text{Quantidade} \times \text{Densidade}}{1.000.000}$$

O custo de cada placa é obtido multiplicando seu peso pelo preço por kg cadastrado.

### 3. Divisor de Formação de Preço de Venda
A margem comercial e encargos incidentes seguem a regra do divisor por dentro, o que impede a perda de margem sobre impostos e comissão:
1. **Custo Base** = $\text{Total Materiais} + \text{Total Componentes/Serviços Terceirizados}$
2. **Custo Base Multiplicado** = $\text{Custo Base} \times \text{Multiplicador Comercial (Ex: 1,5)}$
3. **Custo total de Venda antes de Taxas** = $\text{Custo Base Multiplicado} + \text{Serviços Internos}$
4. **Preço de Venda Final** = $\frac{\text{Custo de Venda antes de Taxas}}{1 - \text{Comissão}\% - \text{Impostos}\%}$

## 📂 Recursos Principais
- **Simulação Imediata:** Botão para carregar instantaneamente o cenário de teste oficial com precisão decimal.
- **Histórico Local:** Salva, carrega e remove rascunhos de orçamentos diretamente do cache do navegador (`localStorage`).
- **Exportação em PDF:** Gera um relatório técnico profissional em formato A4 contendo todos os dados, tabelas de custos e totais prontos para envio ao cliente.
- **Parâmetros Customizáveis:** Painel para alterar preços de P20, 1045, alíquotas de imposto, comissões, multiplicadores e taxas diárias/horárias das atividades.
