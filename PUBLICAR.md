# Publicar o Piromax PASS

## Caminho recomendado

Use um Web Service do Render com disco persistente. O projeto já contém o arquivo `render.yaml`, o comando de inicialização e a verificação de funcionamento necessários.

1. Crie um repositório privado no GitHub e envie os arquivos deste projeto. A pasta local de leads está bloqueada pelo `.gitignore`; não publique `data/piromax-pass.json`.
2. No Render, escolha **New**, depois **Blueprint**, conecte o repositório e selecione o arquivo `render.yaml`.
3. Quando solicitado, crie um valor forte para `PIROMAX_OPERATION_PIN`. Ele protege a área `/#operacao`.
4. Confirme o serviço. A configuração solicita o plano Starter e um disco de 1 GB porque os leads não podem desaparecer em uma reinicialização.
5. Ao terminar, o Render entrega um endereço semelhante a `https://piromax-pass-fenapi.onrender.com`.
6. Abra a URL em todos os celulares da equipe. Faça um cadastro de teste, confira a área de operação, reinicie o serviço e confirme que o cadastro permaneceu salvo.
7. Se desejar, conecte `fenapi.piromax.com.br` como domínio personalizado e use esse endereço no atalho dos celulares.

## Atualizações durante a feira

O `render.yaml` deixa a publicação automática desligada. Isso evita que uma alteração de código reinicie o aplicativo por engano durante o atendimento. Para publicar uma nova versão, use **Manual Deploy** no painel do Render em um horário combinado.

## Dados

Os leads ficam no arquivo `piromax-pass.json` do disco persistente. A área de operação permite baixar CSV. Faça a exportação ao final de cada dia da feira como cópia de segurança.

O armazenamento em arquivo é adequado para esta ação com uma única instância do servidor. Se a Piromax decidir manter o aplicativo como ferramenta permanente ou integrar os contatos ao comercial, migre os registros para um banco de dados e CRM aprovados.

## Antes de entregar aos trabalhadores

- Abra o aplicativo no Safari e escolha **Adicionar à Tela de Início**.
- Mantenha o celular conectado à energia durante o turno.
- Desative o bloqueio automático somente se a política da empresa permitir.
- Teste a rede do stand e mantenha um segundo acesso à internet disponível.
- Oriente a equipe sobre os códigos 111, 112, 113 e 114.
