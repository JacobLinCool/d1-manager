FROM mcr.microsoft.com/devcontainers/base:ubuntu

ENV PNPM_HOME="/usr/local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN export DEBIAN_FRONTEND=noninteractive && \
    rm -f /bin/sh && \
    ln -s /bin/bash /bin/sh && \
    apt update && \
    apt upgrade -y && \
    apt install -y software-properties-common && \
    add-apt-repository -y ppa:git-core/ppa && \
    apt update && \
    apt install -y git bash-completion htop jq lsof less curl zip unzip tree python3 build-essential && \
    apt autoremove -y && \
    rm -f /usr/bin/python && \
    ln -s /usr/bin/python3 /usr/bin/python

RUN curl -fsSL https://get.pnpm.io/install.sh | sh - && \
    pnpm env use -g lts && \
    sudo rm -rf /tmp/* && \
    chmod -R 777 /usr/local/share/pnpm

RUN pnpm i -g pnpm taze tsx prettier @changesets/cli serve
