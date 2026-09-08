# PIROMAX PASS · FENAPI

## Operação assistida no stand

O aplicativo será usado nos celulares dos trabalhadores do stand. Cada atendimento começa pela seleção do perfil do visitante; a equipe digita o código de ativação B2B e preenche o cadastro. No caminho consumidor, confira o Instagram no aparelho do visitante antes de continuar. A confirmação apresenta o vídeo 3D do copo fornecido em MP4 e as fotos disponíveis dos brindes especiais. O botão “Próximo visitante” reinicia a interface sem apagar cadastros anteriores. A retirada B2B continua sendo registrada na área de operação; o fluxo consumidor ainda não registra retirada centralizada.

As instruções anteriores de QR Code para acesso direto do visitante não se aplicam ao uso assistido. Todos os aparelhos da equipe devem acessar o mesmo servidor para compartilhar os registros.

Aplicativo web mobile-first para o QR Code do stand da Piromax na FENAPI. A experiência diferencia consumidor final de lojista e profissional de shows, capta apenas os dados comerciais necessários e libera uma Roda Piromax para todos os perfis.

## O que já funciona

- Escolha de perfil com caminho sem cadastro para consumidor final.
- Link configurável para Instagram e bilhete digital para retirada do copo.
- Cadastro B2B: nome, WhatsApp, cidade, UF, empresa/loja e indicação de cliente Piromax.
- Regra configurável para catálogo. O padrão atual é: catálogo para quem já é cliente Piromax.
- Roda com pesos, estoques por prêmio e copo garantido. Sem resultado vazio.
- Consumidor final também gira a roda, sem preencher cadastro; o resultado é sempre o copo Piromax.
- Um giro por WhatsApp para os perfis B2B. Quem repete o telefone recupera o PASS já criado, sem novo giro.
- Código único de retirada, painel de operação, confirmação de retirada e exportação CSV.
- Estoque central com bloqueio automático dos códigos quando o brinde ou o copo incluído se esgota.
- Cadastro B2B em etapas, com uma pergunta por tela; consumidor informa somente o primeiro nome.
- Ativação discreta no começo do cadastro B2B: a equipe define o brinde por código antes do giro.

## Rodar localmente

Requer Node.js 18 ou superior.

```bash
npm test
npm start
```

Abra `http://localhost:4173`. A área da equipe está em `http://localhost:4173/#operacao`; ela não aparece para o visitante. Antes do evento, defina o PIN no ambiente do servidor com `PIROMAX_OPERATION_PIN`.

## Preparação para a FENAPI

1. Em `app-config.js`, confirme o endereço do Instagram, a regra do catálogo, os prêmios, estoques e os códigos de ativação. O padrão é: `111` copo, `112` copo + bolsa, `113` copo + caneca e `114` copo + camiseta.
2. Publique este projeto em uma hospedagem Node.js com HTTPS e crie o QR Code apontando para a URL final, por exemplo `https://piromax.com.br/fenapi/`.
3. Garanta que a pasta `data/` seja persistente e receba backup. Ela guarda a base central da ação.
4. Defina um `PIROMAX_OPERATION_PIN` forte na configuração do serviço. Não use o valor de exemplo em `app-config.js`.
5. Faça testes em pelo menos dois celulares: ativação com cada código, cadastro, giro, tela do bilhete, confirmação de retirada e CSV.
6. Oriente a equipe: ao escolher “Pirotécnico / Shows” ou “Lojista”, digitar discretamente o código de ativação antes do visitante preencher o formulário. A decisão não fica exposta na interface dele.

## Onde ficam os leads e como publicar

O projeto traz uma API própria em `server.mjs`. Quando publicado, todos os telefones, cadastros, brindes, giros e retiradas ficam em `data/piromax-pass.json` no servidor — não no celular do visitante. O painel busca esse mesmo banco central, então a equipe pode operar de outro aparelho.

Para deixá-lo público, é necessário colocar o projeto em uma hospedagem Node.js com HTTPS, apontar o QR Code para a URL final e manter o PIN da equipe como variável de ambiente. Sem acesso a uma conta de hospedagem da Piromax, esta etapa não pode ser feita daqui.

Para volume maior ou armazenamento corporativo de longo prazo, a mesma interface pode ser conectada a um banco gerenciado ou CRM aprovado pela Piromax. Não incluí nenhuma integração externa sem a escolha e as credenciais da empresa.

Os endpoints de consulta, preparação do prêmio e retirada exigem o PIN de operação. Ainda assim, para uma publicação de produção, recomendo substituir esse PIN por login de equipe/controle de acesso do provedor.

## Estrutura dos dados

Cada lead B2B contém: identificador, código, perfil, nome, WhatsApp normalizado, cidade, UF, empresa/loja, status de cliente, direito ao catálogo, prêmio, horário de giro, horário de retirada, criação e campanha. Isso permite segmentar depois os novos lojistas, profissionais de shows e clientes atuais.

## Observação de promoção

A regra comercial e a mecânica da roleta devem ser validadas internamente/juridicamente pela Piromax antes da publicação. O app permite ajustar nomes, chances e quantidade de brindes, mas não substitui essa validação.
