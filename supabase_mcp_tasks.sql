-- Cria a tabela de tarefas persistentes no Supabase
-- Corre isto em: Supabase → SQL Editor → New Query

CREATE TABLE IF NOT EXISTS mcp_tasks (
  id          UUID        PRIMARY KEY,
  team        TEXT        NOT NULL,
  tool        TEXT        NOT NULL,
  payload     JSONB       NOT NULL DEFAULT '{}',
  schedule    TEXT        NOT NULL DEFAULT 'immediate',
  priority    INTEGER     NOT NULL DEFAULT 3,
  status      TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','running','done','failed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mcp_tasks_status     ON mcp_tasks(status);
CREATE INDEX IF NOT EXISTS idx_mcp_tasks_created_at ON mcp_tasks(created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER mcp_tasks_updated_at
  BEFORE UPDATE ON mcp_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
