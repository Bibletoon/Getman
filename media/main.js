
(function () {
    const vscode = acquireVsCodeApi();
    
    document.querySelector("#fetch").addEventListener("click", async () => await sendRequest());

    const sendRequest = async () => {
        const url = document.querySelector("#url").value;
        const method = document.querySelector("#method").value;
        const headers = [...document.querySelectorAll(".header")].map(header => header.value.split(":")).filter(x => x != "");
        const body = document.querySelector("#body").value; 
        const useHost = document.querySelector("#useHost").checked;
        vscode.postMessage({type : "request", url, method, headers, body, useHost});
    };

    document.querySelector("#add-header").addEventListener("click", () => {
        const header = document.createElement("input");
        header.classList.add("header");
        header.classList.add("styled-input");
        header.placeholder = "Header";
        document.querySelector("#headers").appendChild(header);    
    });

    document.querySelector("#remove-header").addEventListener("click", () => {
        const headers = [...document.querySelectorAll(".header")].filter(x => !x.classList.contains("required"));
        if (headers.length === 0) {
            return;
        }

        const lastEmptyHeader = headers.filter(x => x.value === "").pop();
        if (lastEmptyHeader) {
            lastEmptyHeader.remove();
        } else {
            headers[headers.length - 1].remove();
        }
    });

    document.querySelector("#useHost").addEventListener("change", (e) => {
        if (e.target.checked === true) {
            const header = document.createElement("input");
            header.disabled = true;
            header.classList.add("styled-input");
            header.id = "host";
            header.value="Header:<computed on launch>";
            const firstHeader = document.querySelector("#headers .header");
            if (firstHeader) {
                document.querySelector("#headers").insertBefore(header, firstHeader);
            } else {
                document.querySelector("#headers").appendChild(header);
            }
        } else {
            document.querySelector("#host").remove();
        }
     });
}());
