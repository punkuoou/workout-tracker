import { useState, useEffect } from "react";
{activeTab === "advice" && currentWeek && (
          <AIAdvice weekData={{ ...currentWeek, sessions: localSessions }} />
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
