import { ComplianceRule, DeviceComplianceSummary, FleetComplianceOverview } from '../src/types/compliance';

export function evaluateDeviceCompliance(dev: any): DeviceComplianceSummary {
  const ip = dev.ipAddress || '';
  const isHost = ip === '192.168.0.13' || dev.id === 'real-host-01' || dev.hostname?.includes('nexus') || dev.manufacturer?.includes('NEXUS');
  const isGw = dev.deviceType === 'Router' || ip.endsWith('.1') || dev.id === 'real-gw-01';
  const isAp = dev.deviceType === 'Access Point' || dev.deviceType === 'AccessPoint' || ip.endsWith('.15') || dev.id === 'real-ap-20';
  const isNas = dev.deviceType === 'NAS / Storage' || dev.deviceType === 'Storage' || ip.endsWith('.50') || dev.id === 'real-nas-20';
  const isDns = ip === '1.1.1.1' || ip === '8.8.8.8';

  // If the device already has overridden rules (e.g. from remediation), reuse them if available
  const existingRulesMap: Record<string, ComplianceRule> = {};
  if (dev.compliance?.rules && Array.isArray(dev.compliance.rules)) {
    dev.compliance.rules.forEach((r: ComplianceRule) => {
      existingRulesMap[r.id] = r;
    });
  }

  let baseRules: ComplianceRule[] = [];

  if (isHost) {
    baseRules = [
      {
        id: 'CIS-L1-5.2.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Debian Linux 12 Benchmark v1.0.0',
        title: 'Desativar acesso root direto através do serviço SSH',
        category: 'SSH Hardening',
        parameter: 'PermitRootLogin',
        currentValue: 'yes (Permitido sem restrição)',
        expectedValue: 'no (Acesso direto proibido)',
        status: 'non_compliant',
        severity: 'high',
        cisSection: '5.2.1',
        rationale: 'O acesso root direto via SSH expõe a conta administrativa a ataques contínuos de força bruta e impossibilita a rastreabilidade individual nos logs de auditoria.',
        auditCommand: "grep -Ei '^\\s*PermitRootLogin' /etc/ssh/sshd_config",
        remediationCommand: "sed -i -E 's/^\\s*#?\\s*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config && systemctl reload sshd",
        impactDescription: 'O utilizador root não poderá efetuar login direto; os operadores devem autenticar-se com contas nomeadas e usar sudo.'
      },
      {
        id: 'CIS-L1-5.2.4',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Debian Linux 12 Benchmark v1.0.0',
        title: 'Garantir que apenas o Protocolo SSH v2 é aceite',
        category: 'SSH Hardening',
        parameter: 'Protocol',
        currentValue: '2 (Cifragem moderna)',
        expectedValue: '2',
        status: 'compliant',
        severity: 'medium',
        cisSection: '5.2.4',
        rationale: 'O protocolo SSHv1 possui falhas graves de integridade e vulnerabilidades criptográficas conhecidas.',
        auditCommand: 'sshd -T | grep -i protocol',
        remediationCommand: 'Configuração nominal por omissão no OpenSSH moderno.'
      },
      {
        id: 'CIS-L1-5.2.10',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Debian Linux 12 Benchmark v1.0.0',
        title: 'Limitar o número máximo de tentativas de autenticação SSH',
        category: 'SSH Hardening',
        parameter: 'MaxAuthTries',
        currentValue: '6 (Padrão permissivo)',
        expectedValue: '3 (Ou inferior)',
        status: 'non_compliant',
        severity: 'medium',
        cisSection: '5.2.10',
        rationale: 'Restringir tentativas de autenticação mitiga ataques automatizados de força bruta e dicionário contra portas de gestão.',
        auditCommand: "grep -Ei '^\\s*MaxAuthTries' /etc/ssh/sshd_config",
        remediationCommand: "echo 'MaxAuthTries 3' >> /etc/ssh/sshd_config.d/cis.conf && systemctl reload sshd",
        impactDescription: 'Sessões com mais de 3 falhas de credencial consecutivas são encerradas de imediato.'
      },
      {
        id: 'CIS-L1-5.2.12',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Debian Linux 12 Benchmark v1.0.0',
        title: 'Proibir autenticação com palavras-passe vazias no SSH',
        category: 'Authentication & Passwords',
        parameter: 'PermitEmptyPasswords',
        currentValue: 'no (Bloqueado)',
        expectedValue: 'no (Bloqueado)',
        status: 'compliant',
        severity: 'critical',
        cisSection: '5.2.12',
        rationale: 'Contas com senhas vazias permitem acesso sem qualquer desafio de segurança, comprometendo o nó instantaneamente.',
        auditCommand: "sshd -T | grep -i 'permitemptypasswords'",
        remediationCommand: "sed -i -E 's/^\\s*#?\\s*PermitEmptyPasswords.*/PermitEmptyPasswords no/' /etc/ssh/sshd_config"
      },
      {
        id: 'CIS-L1-5.2.15',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Debian Linux 12 Benchmark v1.0.0',
        title: 'Desativar encaminhamento gráfico X11 no daemon SSH',
        category: 'SSH Hardening',
        parameter: 'X11Forwarding',
        currentValue: 'yes (Ativo por omissão)',
        expectedValue: 'no (Desativado)',
        status: 'non_compliant',
        severity: 'medium',
        cisSection: '5.2.15',
        rationale: 'O encaminhamento X11 permite a clientes SSH aceder ao display gráfico do servidor e executar injeções de eventos se o servidor X for comprometido.',
        auditCommand: "grep -Ei '^\\s*X11Forwarding' /etc/ssh/sshd_config",
        remediationCommand: "sed -i -E 's/^\\s*#?\\s*X11Forwarding.*/X11Forwarding no/' /etc/ssh/sshd_config && systemctl reload sshd",
        impactDescription: 'Aplicações gráficas remotas não poderão ser abertas diretamente pela sessão SSH.'
      },
      {
        id: 'CIS-L1-3.1.2',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Debian Linux 12 Benchmark v1.0.0',
        title: 'Desativar o encaminhamento de pacotes IPv4 no kernel',
        category: 'Routing & Firewalls',
        parameter: 'net.ipv4.ip_forward',
        currentValue: '1 (Ativo / Roteamento ativado)',
        expectedValue: '0 (Desativado em servidores não-roteadores)',
        status: 'non_compliant',
        severity: 'high',
        cisSection: '3.1.2',
        rationale: 'A menos que o nó atue explicitamente como gateway ou roteador, o encaminhamento de pacotes deve estar desligado para evitar trânsito clandestino.',
        auditCommand: 'sysctl net.ipv4.ip_forward',
        remediationCommand: 'sysctl -w net.ipv4.ip_forward=0 && echo "net.ipv4.ip_forward = 0" > /etc/sysctl.d/99-cis-routing.conf',
        impactDescription: 'Impede o servidor de atuar como bridge/router para tráfego alheio à sua pilha local.'
      },
      {
        id: 'CIS-L1-4.1.1',
        standard: 'CIS_LEVEL_2',
        benchmarkName: 'CIS Debian Linux 12 Benchmark v1.0.0',
        title: 'Garantir que o daemon de auditoria auditd está instalado e ativo',
        category: 'Logging & Auditing',
        parameter: 'auditd.service',
        currentValue: 'inactive (Serviço desligado)',
        expectedValue: 'active (running)',
        status: 'non_compliant',
        severity: 'critical',
        cisSection: '4.1.1',
        rationale: 'O auditd é essencial para registar chamadas de sistema privilegiadas, alterações a ficheiros sensíveis e acessos não autorizados para auditoria forense.',
        auditCommand: 'systemctl is-active auditd',
        remediationCommand: 'apt update && apt install -y auditd audispd-plugins && systemctl enable --now auditd',
        impactDescription: 'Gera telemetria local no ficheiro /var/log/audit/audit.log.'
      },
      {
        id: 'CIS-L1-3.3.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Debian Linux 12 Benchmark v1.0.0',
        title: 'Garantir proteção contra ataques TCP SYN Flood',
        category: 'Network Services',
        parameter: 'net.ipv4.tcp_syncookies',
        currentValue: '1 (Ativo)',
        expectedValue: '1',
        status: 'compliant',
        severity: 'high',
        cisSection: '3.3.1',
        rationale: 'SYN cookies permitem ao kernel responder a conexões quando a fila de backlog se esgota sob negação de serviço.',
        auditCommand: 'sysctl net.ipv4.tcp_syncookies',
        remediationCommand: 'sysctl -w net.ipv4.tcp_syncookies=1'
      },
      {
        id: 'CIS-L1-5.4.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Debian Linux 12 Benchmark v1.0.0',
        title: 'Configurar expiração periódica máxima de palavras-passe',
        category: 'Authentication & Passwords',
        parameter: 'PASS_MAX_DAYS',
        currentValue: '99999 (Sem expiração obrigatória)',
        expectedValue: '90 (Ou inferior)',
        status: 'non_compliant',
        severity: 'medium',
        cisSection: '5.4.1',
        rationale: 'Palavras-passe que nunca expiram aumentam a probabilidade de reutilização e comprometimento por credenciais antigas não revogadas.',
        auditCommand: "grep -E '^PASS_MAX_DAYS' /etc/login.defs",
        remediationCommand: "sed -i -E 's/^PASS_MAX_DAYS.*/PASS_MAX_DAYS 90/' /etc/login.defs",
        impactDescription: 'Os utilizadores deverão renovar credenciais a cada 90 dias.'
      },
      {
        id: 'CIS-L1-6.1.2',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Debian Linux 12 Benchmark v1.0.0',
        title: 'Verificar permissões estritas do ficheiro de credenciais /etc/shadow',
        category: 'System Integrity',
        parameter: 'stat /etc/shadow',
        currentValue: '0640 root:shadow',
        expectedValue: '0640 (Apenas root e grupo shadow)',
        status: 'compliant',
        severity: 'critical',
        cisSection: '6.1.2',
        rationale: 'Permissões permissivas no /etc/shadow permitem a leitura direta de hashes criptográficos de senhas por utilizadores comuns.',
        auditCommand: 'stat -c "%a %U:%G" /etc/shadow',
        remediationCommand: 'chmod 640 /etc/shadow && chown root:shadow /etc/shadow'
      }
    ];
  } else if (isGw) {
    baseRules = [
      {
        id: 'CIS-ROS-1.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS RouterOS & Network Device Benchmark v2.1',
        title: 'Desativar serviço de gestão remota Telnet (Porta 23)',
        category: 'Network Services',
        parameter: '/ip service telnet',
        currentValue: 'enabled (Porta 23 aberta)',
        expectedValue: 'disabled',
        status: 'non_compliant',
        severity: 'critical',
        cisSection: '1.1',
        rationale: 'O protocolo Telnet transmite comandos e credenciais em texto claro na rede local, permitindo que um sniffer intercete a senha do router.',
        auditCommand: '/ip service print where name=telnet',
        remediationCommand: '/ip service disable telnet',
        impactDescription: 'Elimina o vetor de interceção não encriptado na rede.'
      },
      {
        id: 'CIS-ROS-1.2',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS RouterOS & Network Device Benchmark v2.1',
        title: 'Desativar consola web WebFig sobre HTTP não cifrado (Porta 80)',
        category: 'Network Services',
        parameter: '/ip service www',
        currentValue: 'enabled on 0.0.0.0/0',
        expectedValue: 'disabled (Usar apenas HTTPS porta 443)',
        status: 'non_compliant',
        severity: 'high',
        cisSection: '1.2',
        rationale: 'Acesso à interface gráfica via HTTP permite ataques Man-in-the-Middle e captura de tokens de sessão WebFig.',
        auditCommand: '/ip service print where name=www',
        remediationCommand: '/ip service disable www; /ip service enable www-ssl',
        impactDescription: 'O acesso à consola Web passará a exigir conexão cifrada TLS/HTTPS.'
      },
      {
        id: 'CIS-ROS-1.3',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS RouterOS & Network Device Benchmark v2.1',
        title: 'Restringir o serviço de gestão WinBox a sub-redes autorizadas',
        category: 'Access Control',
        parameter: '/ip service winbox address',
        currentValue: '0.0.0.0/0 (Aberto a qualquer origem)',
        expectedValue: '192.168.0.0/24 (Sub-rede de Gestão restrita)',
        status: 'non_compliant',
        severity: 'critical',
        cisSection: '1.3',
        rationale: 'O serviço WinBox é historicamente alvo de exploração de vulnerabilidades zero-day (ex.: CVE-2023-30799). Deve estar limitado a IPs fidedignos.',
        auditCommand: '/ip service print where name=winbox',
        remediationCommand: '/ip service set winbox address=192.168.0.0/24',
        impactDescription: 'Apenas dispositivos na gama autorizada conseguirão abrir conexão WinBox.'
      },
      {
        id: 'CIS-ROS-2.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS RouterOS & Network Device Benchmark v2.1',
        title: 'Desativar ou renomear a conta padrão de superutilizador "admin"',
        category: 'Authentication & Passwords',
        parameter: '/user print where name=admin',
        currentValue: 'admin (Ativo com palavra-passe)',
        expectedValue: 'admin desativado após criar utilizador nomeado',
        status: 'non_compliant',
        severity: 'high',
        cisSection: '2.1',
        rationale: 'Quase todos os ataques automatizados contra RouterOS assumem "admin" como o utilizador pré-definido.',
        auditCommand: '/user print',
        remediationCommand: '/user add name=sysops group=full password="STRONG_PASSWORD"; /user disable admin',
        impactDescription: 'Mitiga 99% dos scanners automatizados de login brute-force.'
      },
      {
        id: 'CIS-ROS-3.2',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS RouterOS & Network Device Benchmark v2.1',
        title: 'Desativar o servidor de teste de largura de banda (Bandwidth Test Server)',
        category: 'Network Services',
        parameter: '/tool bandwidth-server enabled',
        currentValue: 'yes (Ativo sem autenticação)',
        expectedValue: 'no',
        status: 'non_compliant',
        severity: 'medium',
        cisSection: '3.2',
        rationale: 'O servidor de teste de banda aberto pode ser abusado por atacantes para saturar a CPU do router e exaurir os recursos de comutação.',
        auditCommand: '/tool bandwidth-server print',
        remediationCommand: '/tool bandwidth-server set enabled=no',
        impactDescription: 'O teste de banda interno fica inativo até ser explicitamente reativado.'
      },
      {
        id: 'CIS-ROS-4.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS RouterOS & Network Device Benchmark v2.1',
        title: 'Prevenir resolução de DNS aberta na interface pública WAN',
        category: 'Routing & Firewalls',
        parameter: 'DNS Open Resolver',
        currentValue: 'allow-remote-requests=yes (Sem filtro de drop na WAN)',
        expectedValue: 'allow-remote-requests com bloqueio WAN ativo',
        status: 'non_compliant',
        severity: 'high',
        cisSection: '4.1',
        rationale: 'Routers com DNS recursivo aberto na WAN são frequentemente explorados como amplificadores em ataques distribuídos de negação de serviço (DDoS DNS Amplification).',
        auditCommand: '/ip dns print; /ip firewall filter print where chain=input and dst-port=53',
        remediationCommand: '/ip firewall filter add chain=input in-interface=wan protocol=udp dst-port=53 action=drop comment="Drop WAN DNS"',
        impactDescription: 'Clientes externos deixam de conseguir usar o router como resolvedor público.'
      },
      {
        id: 'CIS-ROS-5.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS RouterOS & Network Device Benchmark v2.1',
        title: 'Garantir sincronização horária com servidores NTP fidedignos',
        category: 'Logging & Auditing',
        parameter: '/system ntp client',
        currentValue: 'pool.ntp.org configurado e sincronizado',
        expectedValue: 'configurado com servidores NTP redundantes',
        status: 'compliant',
        severity: 'medium',
        cisSection: '5.1',
        rationale: 'Timestamps corretos são indispensáveis para correlação de eventos de segurança, validação de certificados TLS e análise forense.',
        auditCommand: '/system ntp client print',
        remediationCommand: '/system ntp client set enabled=yes servers=0.pool.ntp.org,1.pool.ntp.org'
      },
      {
        id: 'CIS-ROS-6.2',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS RouterOS & Network Device Benchmark v2.1',
        title: 'Forçar cifras criptográficas fortes no SSH do RouterOS',
        category: 'SSH Hardening',
        parameter: '/ip ssh strong-crypto',
        currentValue: 'yes (Ativo)',
        expectedValue: 'yes',
        status: 'compliant',
        severity: 'high',
        cisSection: '6.2',
        rationale: 'Desativa cifras legadas fracas como DES, 3DES e MD5 no canal de gestão SSH.',
        auditCommand: '/ip ssh print',
        remediationCommand: '/ip ssh set strong-crypto=yes'
      }
    ];
  } else if (isAp) {
    baseRules = [
      {
        id: 'CIS-WIFI-1.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Wireless Access Point Security Benchmark v1.2',
        title: 'Garantir imposição de WPA3 e Protected Management Frames (PMF)',
        category: 'Network Services',
        parameter: 'Protected Management Frames (PMF)',
        currentValue: 'optional (Modo misto WPA2/WPA3)',
        expectedValue: 'required (PMF Enforced obrigatório)',
        status: 'non_compliant',
        severity: 'high',
        cisSection: '1.1',
        rationale: 'Sem PMF obrigatório, atacantes adjacentes podem enviar pacotes forjados de desautenticação 802.11 e forçar desconexões ou handshakes parciais (ex.: CVE-2023-52160).',
        auditCommand: 'unifi_cli get-wlan --ssid "Office-WLAN" | grep pmf',
        remediationCommand: 'No UniFi Controller > Configurações Wi-Fi > Segurança > Definir PMF como "Obrigatório" e ativar WPA3.',
        impactDescription: 'Dispositivos clientes legados incompatíveis com 802.11w precisarão de perfil específico.'
      },
      {
        id: 'CIS-WIFI-2.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Wireless Access Point Security Benchmark v1.2',
        title: 'Restringir gestão SSH do AP a autenticação por chave pública',
        category: 'SSH Hardening',
        parameter: 'Device Authentication Key',
        currentValue: 'Permite autenticação por palavra-passe simples',
        expectedValue: 'Apenas chave pública SSH (SSH Keys Only)',
        status: 'non_compliant',
        severity: 'medium',
        cisSection: '2.1',
        rationale: 'Credenciais de gestão em texto nos controladores podem ser expostas; chaves assimétricas SSH asseguram autenticação forte.',
        auditCommand: 'ssh -o PreferredAuthentications=password ubnt@192.168.20.15',
        remediationCommand: 'UniFi Network > Settings > System > Device Authentication > Carregar chave SSH e desativar password.',
        impactDescription: 'Acesso CLI ao ponto de acesso exigirá a chave privada correspondente.'
      },
      {
        id: 'CIS-WIFI-3.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Wireless Access Point Security Benchmark v1.2',
        title: 'Isolamento de Clientes (Client Isolation) na rede Guest e VLANs secundárias',
        category: 'Access Control',
        parameter: 'Client Isolation (L2 Isolation)',
        currentValue: 'enabled na VLAN 20',
        expectedValue: 'enabled',
        status: 'compliant',
        severity: 'high',
        cisSection: '3.1',
        rationale: 'Impede comunicação lateral entre dispositivos sem fios não fidedignos conectados à mesma antena.',
        auditCommand: 'unifi_cli get-wlan --ssid "Guest" | grep l2_isolation',
        remediationCommand: 'Ativar "Isolamento de Clientes" nas propriedades da rede sem fios.'
      },
      {
        id: 'CIS-WIFI-4.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Wireless Access Point Security Benchmark v1.2',
        title: 'Deteção de Pontos de Acesso Falsos (Rogue APs) e Varredura WIDS',
        category: 'System Integrity',
        parameter: 'Wireless IDS / Rogue AP Detection',
        currentValue: 'active',
        expectedValue: 'active',
        status: 'compliant',
        severity: 'medium',
        cisSection: '4.1',
        rationale: 'Alerta os administradores sobre APs clonados ou equipamentos não autorizados que usem o mesmo SSID da infraestrutura.',
        auditCommand: 'unifi_cli get-security --wids',
        remediationCommand: 'Ativar "Detetor de Rogue APs" no painel de segurança UniFi.'
      },
      {
        id: 'CIS-WIFI-5.2',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Wireless Access Point Security Benchmark v1.2',
        title: 'Consola e Portal Cativo estritamente sobre HTTPS',
        category: 'Network Services',
        parameter: 'Portal Redirect HTTPS',
        currentValue: 'enforced (TLS 1.3)',
        expectedValue: 'enforced',
        status: 'compliant',
        severity: 'high',
        cisSection: '5.2',
        rationale: 'Protege contra roubo de credenciais ou cookies de autenticação em portais de autenticação sem fios.',
        auditCommand: 'curl -I http://192.168.20.15/ | grep -i location',
        remediationCommand: 'Verificado nominal.'
      }
    ];
  } else if (isNas) {
    baseRules = [
      {
        id: 'CIS-NAS-1.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Storage & NAS Hardening Benchmark v1.3',
        title: 'Desativar a conta de administrador padrão "admin"',
        category: 'Authentication & Passwords',
        parameter: 'Synology admin account state',
        currentValue: 'disabled (Desativada)',
        expectedValue: 'disabled',
        status: 'compliant',
        severity: 'high',
        cisSection: '1.1',
        rationale: 'A desativação do utilizador padrão admin mitiga ataques automáticos de dicionário.',
        auditCommand: 'synouser --get admin',
        remediationCommand: 'Painel de Controlo > Utilizador e Grupo > admin > Desativar conta.'
      },
      {
        id: 'CIS-NAS-2.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Storage & NAS Hardening Benchmark v1.3',
        title: 'Desativar completamente o protocolo legado SMBv1',
        category: 'Network Services',
        parameter: 'SMB Min Protocol',
        currentValue: 'SMB2 mínimo (SMBv1 desativado)',
        expectedValue: 'SMB2 ou SMB3 mínimo',
        status: 'compliant',
        severity: 'critical',
        cisSection: '2.1',
        rationale: 'O SMBv1 é altamente vulnerável a ataques de exploração remota de memória (como EternalBlue / WannaCry).',
        auditCommand: 'synoservice --get-smb-min-protocol',
        remediationCommand: 'Painel de Controlo > Serviços de Ficheiros > SMB > Definições Avançadas > Protocolo SMB Mínimo: SMB2.'
      },
      {
        id: 'CIS-NAS-3.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Storage & NAS Hardening Benchmark v1.3',
        title: 'Exigir Autenticação de Dois Fatores (2FA) para Administradores',
        category: 'Authentication & Passwords',
        parameter: '2-Factor Authentication Enforcement',
        currentValue: 'optional (Apenas utilizadores individuais ativaram)',
        expectedValue: 'enforced para todo o grupo de administradores',
        status: 'non_compliant',
        severity: 'high',
        cisSection: '3.1',
        rationale: 'O acesso a repositórios de dados corporativos e backups exige verificação multi-fator para prevenir intrusões por senhas comprometidas.',
        auditCommand: 'synosecurity --get-2fa-status',
        remediationCommand: 'Painel de Controlo > Segurança > Conta > Aplicar verificação em 2 passos para os seguintes utilizadores ou grupos > Selecionar "administrators".',
        impactDescription: 'Todos os administradores do NAS deverão associar uma app de autenticação (TOTP) no próximo login.'
      },
      {
        id: 'CIS-NAS-4.2',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Storage & NAS Hardening Benchmark v1.3',
        title: 'Desativar serviço FTP não encriptado na porta 21',
        category: 'Network Services',
        parameter: 'FTP Service Plaintext',
        currentValue: 'enabled na porta 21',
        expectedValue: 'disabled (Usar exclusivamente SFTP ou FTPS)',
        status: 'non_compliant',
        severity: 'high',
        cisSection: '4.2',
        rationale: 'O serviço de FTP comum envia ficheiros e palavras-passe em texto limpo pela rede interna.',
        auditCommand: 'netstat -tuln | grep :21',
        remediationCommand: 'Painel de Controlo > Serviços de Ficheiros > FTP > Desmarcar "Ativar serviço de FTP (sem encriptação)".',
        impactDescription: 'Clientes de transferência devem usar SFTP sobre a porta SSH ou FTPS com TLS.'
      },
      {
        id: 'CIS-NAS-5.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Storage & NAS Hardening Benchmark v1.3',
        title: 'Garantir proteção contra força bruta (Auto Block)',
        category: 'Access Control',
        parameter: 'Synology Auto Block',
        currentValue: 'active (5 tentativas falhadas em 10 minutos)',
        expectedValue: 'active',
        status: 'compliant',
        severity: 'high',
        cisSection: '5.1',
        rationale: 'Bloqueia endereços IP após um número pré-definido de tentativas falhadas de autenticação.',
        auditCommand: 'synosecurity --get-autoblock-status',
        remediationCommand: 'Painel de Controlo > Segurança > Bloqueio Automático > Ativar.'
      },
      {
        id: 'CIS-NAS-6.3',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Storage & NAS Hardening Benchmark v1.3',
        title: 'Forçar cifragem de transporte em partilhas de ficheiros SMB',
        category: 'Network Services',
        parameter: 'SMB Transport Encryption',
        currentValue: 'disabled na partilha corporativa /dados',
        expectedValue: 'enabled (Cifragem de tráfego ativada)',
        status: 'non_compliant',
        severity: 'medium',
        cisSection: '6.3',
        rationale: 'Sem cifragem de transporte, dados corporativos e ficheiros em trânsito podem ser intercetados na rede local.',
        auditCommand: 'smbstatus | grep -i encryption',
        remediationCommand: 'Painel de Controlo > Pasta Partilhada > Selecionar Pasta > Editar > Avançadas > Cifragem de transferência de ficheiros: Forçar.',
        impactDescription: 'Clientes Windows/Mac sem suporte a cifragem SMB3 não conseguirão montar a partilha.'
      }
    ];
  } else {
    baseRules = [
      {
        id: 'CIS-NET-1.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Generic Infrastructure Benchmark v1.0',
        title: 'Verificar suporte a validação DNSSEC no resolvedor',
        category: 'Network Services',
        parameter: 'DNSSEC Validation',
        currentValue: 'enforced (Validação ativa)',
        expectedValue: 'enforced',
        status: 'compliant',
        severity: 'high',
        cisSection: '1.1',
        rationale: 'DNSSEC protege contra envenenamento de cache DNS e redirecionamentos maliciosos de tráfego.',
        auditCommand: 'dig +dnssec @' + ip + ' example.com',
        remediationCommand: 'Verificado nominal.'
      },
      {
        id: 'CIS-NET-2.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Generic Infrastructure Benchmark v1.0',
        title: 'Garantir transporte cifrado de consultas de infraestrutura',
        category: 'Network Services',
        parameter: 'Encrypted Transport Support',
        currentValue: 'supported (DoH / DoT ativo)',
        expectedValue: 'supported',
        status: 'compliant',
        severity: 'medium',
        cisSection: '2.1',
        rationale: 'Consultas DNS em texto claro revelam padrões de navegação e metadados de rede a observadores externos.',
        auditCommand: 'kdig -d @' + ip + ' +tls example.com',
        remediationCommand: 'Verificado nominal.'
      },
      {
        id: 'CIS-NET-3.1',
        standard: 'CIS_LEVEL_1',
        benchmarkName: 'CIS Generic Infrastructure Benchmark v1.0',
        title: 'Descarte de pacotes ICMP Broadcast (Smurf Attack Protection)',
        category: 'Routing & Firewalls',
        parameter: 'net.ipv4.icmp_echo_ignore_broadcasts',
        currentValue: '1 (Ativo)',
        expectedValue: '1',
        status: 'compliant',
        severity: 'medium',
        cisSection: '3.1',
        rationale: 'Evita que o equipamento atue como amplificador em ataques do tipo Smurf.',
        auditCommand: 'sysctl net.ipv4.icmp_echo_ignore_broadcasts',
        remediationCommand: 'sysctl -w net.ipv4.icmp_echo_ignore_broadcasts=1'
      }
    ];
  }

  // Merge with any existing overrides (e.g., if a parameter was marked as remediated in this session)
  const finalRules = baseRules.map(rule => {
    if (existingRulesMap[rule.id]) {
      return {
        ...rule,
        status: existingRulesMap[rule.id].status,
        currentValue: existingRulesMap[rule.id].currentValue
      };
    }
    return rule;
  });

  const total = finalRules.length;
  const compliant = finalRules.filter(r => r.status === 'compliant').length;
  const nonCompliant = finalRules.filter(r => r.status === 'non_compliant').length;
  const warning = finalRules.filter(r => r.status === 'warning').length;
  const na = finalRules.filter(r => r.status === 'not_applicable').length;

  const critFails = finalRules.filter(r => r.status === 'non_compliant' && r.severity === 'critical').length;
  const highFails = finalRules.filter(r => r.status === 'non_compliant' && r.severity === 'high').length;
  const medFails = finalRules.filter(r => r.status === 'non_compliant' && r.severity === 'medium').length;

  const validChecks = total - na;
  const score = validChecks > 0 ? Math.round((compliant / validChecks) * 100) : 100;

  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  const benchmarkName = finalRules[0]?.benchmarkName || 'CIS Benchmark Padrão';
  const standard = finalRules[0]?.standard || 'CIS_LEVEL_1';

  const summary: DeviceComplianceSummary = {
    complianceScore: score,
    totalRules: total,
    compliantCount: compliant,
    nonCompliantCount: nonCompliant,
    warningCount: warning,
    notApplicableCount: na,
    criticalFails: critFails,
    highFails: highFails,
    mediumFails: medFails,
    lastAuditDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
    grade,
    rules: finalRules,
    benchmarkName,
    standard,
    totalChecks: total,
    passedChecks: compliant,
    failedChecks: nonCompliant,
    warningChecks: warning,
    criticalGaps: critFails,
    highGaps: highFails,
    lastAudited: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };

  dev.compliance = summary;
  return summary;
}

export function remediateComplianceRule(dev: any, ruleId: string): boolean {
  if (!dev.compliance || !Array.isArray(dev.compliance.rules)) {
    evaluateDeviceCompliance(dev);
  }

  const rule = dev.compliance.rules.find((r: ComplianceRule) => r.id === ruleId);
  if (!rule) return false;

  rule.status = 'compliant';
  rule.currentValue = rule.expectedValue;

  // Recalculate summary
  const rules = dev.compliance.rules;
  const total = rules.length;
  const compliant = rules.filter((r: ComplianceRule) => r.status === 'compliant').length;
  const nonCompliant = rules.filter((r: ComplianceRule) => r.status === 'non_compliant').length;
  const warning = rules.filter((r: ComplianceRule) => r.status === 'warning').length;
  const na = rules.filter((r: ComplianceRule) => r.status === 'not_applicable').length;

  const critFails = rules.filter((r: ComplianceRule) => r.status === 'non_compliant' && r.severity === 'critical').length;
  const highFails = rules.filter((r: ComplianceRule) => r.status === 'non_compliant' && r.severity === 'high').length;
  const medFails = rules.filter((r: ComplianceRule) => r.status === 'non_compliant' && r.severity === 'medium').length;

  const validChecks = total - na;
  const score = validChecks > 0 ? Math.round((compliant / validChecks) * 100) : 100;

  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  dev.compliance = {
    ...dev.compliance,
    complianceScore: score,
    totalRules: total,
    compliantCount: compliant,
    nonCompliantCount: nonCompliant,
    warningCount: warning,
    criticalFails: critFails,
    highFails: highFails,
    mediumFails: medFails,
    grade,
    totalChecks: total,
    passedChecks: compliant,
    failedChecks: nonCompliant,
    warningChecks: warning,
    criticalGaps: critFails,
    highGaps: highFails,
    lastAuditDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
    lastAudited: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };

  return true;
}

export function calculateFleetCompliance(devices: any[]): FleetComplianceOverview {
  let totalEvaluated = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalWarnings = 0;
  let totalCriticalGaps = 0;
  let totalHighGaps = 0;

  const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  const paramMap = new Map<string, { count: number; severity: any; category: any }>();

  devices.forEach(dev => {
    if (!dev.compliance) {
      evaluateDeviceCompliance(dev);
    }
    const c = dev.compliance as DeviceComplianceSummary;
    totalEvaluated += c.totalRules;
    totalPassed += c.compliantCount;
    totalFailed += c.nonCompliantCount;
    totalWarnings += c.warningCount;
    totalCriticalGaps += c.criticalFails;
    totalHighGaps += c.highFails;

    grades[c.grade] = (grades[c.grade] || 0) + 1;

    c.rules.forEach(r => {
      if (r.status === 'non_compliant') {
        const existing = paramMap.get(r.parameter) || { count: 0, severity: r.severity, category: r.category };
        existing.count += 1;
        paramMap.set(r.parameter, existing);
      }
    });
  });

  const fleetScore = totalEvaluated > 0 ? Math.round((totalPassed / totalEvaluated) * 100) : 100;

  const topParams = Array.from(paramMap.entries())
    .map(([param, data]) => ({
      parameter: param,
      affectedCount: data.count,
      severity: data.severity,
      category: data.category
    }))
    .sort((a, b) => b.affectedCount - a.affectedCount)
    .slice(0, 5);

  return {
    fleetComplianceScore: fleetScore,
    totalDevicesAudited: devices.length,
    totalChecksEvaluated: totalEvaluated,
    totalPassed,
    totalFailed,
    totalWarnings,
    criticalGaps: totalCriticalGaps,
    highGaps: totalHighGaps,
    devicesByGrade: grades,
    topNonCompliantParameters: topParams,
    timestamp: new Date().toISOString()
  };
}
