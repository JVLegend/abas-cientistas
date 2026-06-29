# Instalação No Chrome

Este guia mostra como instalar o **Abas Cientistas** manualmente no Chrome usando o modo de desenvolvedor.

## Opção Recomendada: Instalar Pelo Pacote Da Release

1. Acesse: <https://github.com/JVLegend/abas-cientistas/releases>
2. Abra a versão mais recente.
3. Baixe o arquivo:

```text
abas-cientistas-extension.zip
```

4. Descompacte o `.zip`.
5. Confirme que a pasta descompactada contém estes arquivos:

```text
manifest.json
index.html
style.css
app.js
background.js
icons/
```

6. Abra o Chrome e acesse:

```text
chrome://extensions
```

7. Ative **Developer mode** no canto superior direito.
8. Clique em **Load unpacked**.
9. Selecione a pasta descompactada:

```text
abas-cientistas-extension
```

10. Abra uma nova aba.

Se tudo estiver correto, a nova aba do Chrome será substituída pelo painel **Abas Cientistas**.

## Instalar Pelo Código-Fonte

Use esta opção se você quer modificar o projeto.

```bash
git clone https://github.com/JVLegend/abas-cientistas.git
```

Depois carregue esta pasta em `chrome://extensions`:

```text
abas-cientistas/extension
```

## Atualizar Para Uma Nova Versão

1. Baixe o novo pacote da release.
2. Descompacte em uma pasta nova ou substitua a pasta antiga.
3. Volte em `chrome://extensions`.
4. Clique em **Reload** no card do **Abas Cientistas**.
5. Abra uma nova aba.

## Problemas Comuns

### Nenhuma aba aparece no painel

Provável causa: você abriu `index.html` diretamente como arquivo.

Solução: carregue a pasta pelo `chrome://extensions` usando **Load unpacked**.

### O Chrome diz que o manifest não existe

Você provavelmente selecionou a pasta errada.

Selecione a pasta que contém o arquivo `manifest.json` diretamente dentro dela.

### A extensão aparece, mas a nova aba não mudou

1. Verifique se o **Abas Cientistas** está ativado em `chrome://extensions`.
2. Clique em **Reload**.
3. Feche e abra uma nova aba.

### Aparecem avisos de modo desenvolvedor

Isso é normal para extensões instaladas fora da Chrome Web Store.

## Segurança

A extensão usa permissões para ler abas abertas e montar o painel localmente. Ela não envia esses dados para servidores externos.
