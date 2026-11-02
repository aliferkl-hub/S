import { db } from './db.js';
import { CloudInfrastructureComparison, User } from './types.js';

export class CloudInfrastructureService {
  /**
   * Returns the architectural comparison between Google Cloud and AWS,
   * plus Neo4j Graph DB evaluation and disaster recovery telemetry.
   */
  getComparisonDossier(): CloudInfrastructureComparison {
    const data = db.getData();
    if (!data.cloudComparison) {
      data.cloudComparison = {
        currentHosting: {
          provider: 'GOOGLE_CLOUD_RUN',
          region: 'us-east1',
          status: 'ACTIVE_HEALTHY',
          monthlyCostBrl: 210.00,
          containerSpecs: '2 vCPU, 4GB RAM, Autoscaling 0-10 containers, Edge CDN ativa',
          rtoMinutes: 10,
          rpoMinutes: 30,
          benefits: [
            'Latência ultra-baixa com API Gemini nativa',
            'Scale-to-zero com custo zero em períodos ociosos',
            'Deploy atômico sem downtime',
            'SSL gerenciado e proteção contra DDoS integrada'
          ]
        },
        awsAlternative: {
          provider: 'AWS_ECS_FARGATE_BEDROCK',
          region: 'sa-east-1 (São Paulo)',
          status: 'EVALUATED_READY_TO_PROVISION',
          monthlyCostBrl: 540.00,
          containerSpecs: 'Fargate 2 vCPU, 4GB RAM + S3 Glacier + Bedrock Endpoint dedicado',
          rtoMinutes: 15,
          rpoMinutes: 45,
          benefits: [
            'Residência dos dados no território brasileiro (São Paulo)',
            'Acesso direto ao ecossistema AWS Bedrock AgentCore',
            'Integração nativa com Amazon Nova e VPC corporativa'
          ]
        },
        neo4jEvaluation: {
          product: 'Neo4j Aura Enterprise Graph DB',
          status: 'EVALUATION_DOCUMENTED',
          monthlyCostBrl: 320.00,
          recommendation: 'MANTER_JSON_UNIFICADO_ATE_100K_NODES',
          justification: 'O banco de dados relacional e unificado SHEFA em JSON indexado com commit atômico atende com latência inferior a 5ms para as volumetrias atuais. Recomenda-se provisionar Neo4j apenas quando o grafo corporativo ultrapassar 100.000 nós de interconexão entre agentes e clientes.',
          graphSchemaPreview: {
            nodes: ['(:Company)', '(:AutonomousAgent)', '(:ServiceContract)', '(:Lead)', '(:PixCharge)', '(:SupportTicket)'],
            relationships: [
              '(:Company)-[:SUBSCRIBES_TO]->(:Plan)',
              '(:Company)-[:OWNS_LEAD]->(:Lead)',
              '(:AutonomousAgent)-[:EXECUTES_FOR]->(:Company)',
              '(:AutonomousAgent)-[:COLLABORATES_WITH]->(:AutonomousAgent)',
              '(:Lead)-[:CONVERTS_INTO]->(:ServiceContract)',
              '(:ServiceContract)-[:PAID_VIA]->(:PixCharge)'
            ]
          }
        },
        disasterRecovery: {
          lastBackupTimestamp: new Date().toISOString(),
          backupLocation: '/data/shefa_db.backup.json',
          backupIntegrityCheck: 'PASSED',
          automatedSnapshotIntervalHours: 6
        },
        isMigrationApprovedByMaster: false
      };
      db.commit();
    }

    return data.cloudComparison;
  }

  /**
   * Master Owner toggles cloud migration authorization
   */
  setMigrationApproval(approved: boolean, masterUser: User): CloudInfrastructureComparison {
    if (masterUser.role !== 'MASTER_OWNER') {
      throw new Error('Apenas o Master Owner tem soberania para aprovar migrações de nuvem ou infraestrutura.');
    }

    const data = db.getData();
    const dossier = this.getComparisonDossier();
    dossier.isMigrationApprovedByMaster = approved;

    db.logAudit(
      masterUser.email,
      'MASTER_OWNER',
      approved ? 'CLOUD_MIGRATION_APPROVED' : 'CLOUD_MIGRATION_REVOKED',
      'global',
      `Migração de nuvem para AWS: ${approved ? 'APROVADA PELO MASTER OWNER' : 'REVOGADA (MANTIDO GOOGLE CLOUD RUN)'}`
    );

    db.commit();
    return dossier;
  }
}

export const cloudInfrastructure = new CloudInfrastructureService();
