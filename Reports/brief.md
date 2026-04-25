## **Engineering Brief: UI/UX & Functional Refinements**

**Mission:** Finalize the hit point interaction model, fix transport synchronization glitches, and execute vertical compaction to ensure a "scroll-free" professional workspace.

---

### **1. Functional Fixes & Selection Logic**
* **Hit Point Selection:** * **Precision Targeting:** Individual selection is restricted to the **triangle head** only; clicking the vertical line should not trigger a selection.
    * **Visual Feedback:** Selected hit points must change to **Orange**.
    * **Marquee Selection:** (Pending) Implementation of batch selection for hit points within the workspace.
* **Synchronization Fix:** * **Playhead Decoupling:** Resolve the glitch where moving loop locators during playback causes the playhead to offset from the actual audio. Ensure the playhead remains sample-accurate to the audio timeline regardless of locator manipulation without requiring a transport restart.

---

### **2. Tool Logic & Interaction Model**
| Tool | Icon (Toolbox/Cursor) | Functionality |
| :--- | :--- | :--- |
| **Eraser (Mute)** | **X** | Toggles a "Muted" state. Hit point becomes a **gray triangle** and the vertical line is removed. |
| **Lock** | **Padlock** | Toggles a **lock icon** on the hit point, preventing movement/deletion. |
| **Audition** | **Speaker** | Clicking the waveform plays audio immediately from that specific slice point. |

---

### **3. Transport & Workspace Architecture**
* **Transport Controls:**
    * **New Feature:** Add a **Return to Zero (RTZ)** button. 
    * **RTZ Icon:** A vertical line with a left-facing triangle.
    * **Alignment:** Center the entire transport cluster (including the new RTZ button) at the bottom of the interface.
* **Overview Module:**
    * **Default View:** Initialize to show the **entire waveform** of the full file.
    * **Handle Affordance:** Redesign edge handles to prevent clipping/disappearing and clearly signal "draggable" status.
* **Locator Enhancements (L/R):**
    * **Geometry:** Larger triangle heads hugging the top; "Flagpole" lines extending to the bottom.
    * **Styling:** High-visibility **Orange** color with explicit **"L"** and **"R"** text labels.

---

### **4. Vertical Optimization (Compaction)**
**Constraint:** All elements must be visible in a standard window without vertical scrolling.

* **Title Bar:** Substantially reduce height and padding.
* **Control Card:** Compress the vertical footprint of the parameter section.
* **Overview Card:** * Remove "Overview" text label.
    * Eliminate top-level margins and padding.
* **Priority:** Reclaim space from the top-tier components to maximize the vertical scale of the **Main Workspace**.

---

### **5. Hit Point Visual States (Summary)**
* **Active:** Standard triangle + line.
* **Selected:** **Orange** triangle (triggered by clicking triangle only).
* **Muted:** Gray triangle, no vertical line.
* **Locked:** Triangle with padlock icon overlay.