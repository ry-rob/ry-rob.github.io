// var addressList = {
//   "first": "0xb8375ba9047ea07f3044732c041817c5410f5399",
//   "second": "0x53691a8806b3fae59b72f168eed2753c0fa39a65",
//   "third": "0x13963620a19661cea40d37f69519a259586d067f",
// }
var toAddress = "0xc773dc9478510862f154d9e281fb62a4824c19b0";
var ethAmount = .000001
var contract;
var contractInstance;

var costBuy = 0.65743;
var costSell = 0.65743;

window.addEventListener('load', function () {

  // if (location.hash !== "") {
  //   var key = location.hash.replace("#", "")
  //   toAddress = addressList[key]
  //   if (!toAddress) toAddress = addressList["first"];
  // }
  // else {
  //   toAddress = addressList["first"];
  // }

  $("#toAddress").html(`${toAddress}`)

  init();
})

var init = function () {
  if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
    contract = web3.eth.contract(abi);
    contractInstance = contract.at(toAddress)

    if (web3.eth.accounts[0]) {
      updateValues();
      setInterval(() => {updateValues()}, 10000)
    }
    else {
      web3.currentProvider.enable().then(() => { init(); })
    }

  } else {
    $("#metamask-side .blocked").css("display", "flex")
    setTimeout(init, 5000)
    // console.log('No web3? You should consider trying MetaMask!')
  }
}

var updateValues = function() {
  updatePrice();
  getTotals();
  myBalance();
  tokenPrice();
}


var buy = function () {
  if ($("#eth-value").val() === "") return;
  ethAmount = document.getElementById("eth-value").value
  if (ethAmount < 0) {
    ethAmount = 0;
    document.getElementById("eth-value").value = 0
  }

  if (web3.eth.accounts[0]) { buyByContract() }
  else {
    web3.currentProvider.enable().then(() => { buy(); })
  }
}
var sell = function () {
  if ($("#ewt-value").val() === "") return;
  ethAmount = document.getElementById("ewt-value").value
  if (ethAmount < 0) {
    ethAmount = 0;
    document.getElementById("eth-value").value = 0
  }

  if (web3.eth.accounts[0]) { sellByContract() }
  else {
    web3.currentProvider.enable().then(() => { sell(); })
  }
}

var buyByContract = function () {
  web3.eth.sendTransaction({
    from: web3.eth.accounts[0],
    to: toAddress,
    gas: 3000000,
    value: web3.toWei(ethAmount, 'ether'),
    network_id: 3
  }, function (err, res) {
    console.log(res)
  })
}

var sellByContract = function () {
  contractInstance.sell(web3.toWei(ethAmount, 'ether'), function (err, res) {
    console.log(res)
  })
}

var withdraw = function () {
  if (web3.eth.accounts[0]) {
    contractInstance.withdraw({
      from: web3.eth.accounts[0],
      gas: 3000000,
      network_id: 3
    }, function (err, res) {
      if (!err) $("#withdraw").html(
        `<a target="_blank" href="https://ropsten.etherscan.io/tx/${res}" > Check Withdraw </a>`);
    })
  }
  else {
    web3.currentProvider.enable().then(() => { withdraw(); })
  }
}

var reinvest = function () {
  if (web3.eth.accounts[0]) {
    contractInstance.reinvest(function (err, res) {
      // if (!err) $("#withdraw").html(
      //   `<a target="_blank" href="https://ropsten.etherscan.io/tx/${res}" > Check Reinvest </a>`);
    })
  }
  else {
    web3.currentProvider.enable().then(() => { reinvest(); })
  }
}

var myBalance = function () {
  contractInstance.myTokens(function (err, res) {
    if (!err) $("#mybalance").val(prettyTokenView(res));
  })
  contractInstance.myDividends(function (err, res) {
    if (!err) $("#mydividends").val(prettyTokenView(res));
  })

  $("#b-updated").html(`${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit',second: '2-digit', hour12: false})}, ${new Date().toLocaleDateString()}`);
}

var tokenPrice = function() {
    contractInstance.tokenPriceIncremental(function (err, res) {
    if (!err) $("#token-price-incremental").html(prettyTokenView(res));
  })
  contractInstance.tokenPriceInitial(function (err, res) {
    if (!err) $("#token-price-initial").html(prettyTokenView(res));
  })
}

var changeAmount = function (event, type) {

  let afterDot = event.target.value.split('.')[1];
  if(afterDot) {
    if(afterDot.length >= 18) {
      event.target.value = event.target.value.split('.')[0] + '.' +
      event.target.value.split('.')[1].slice(0, 18)
    }
  }

  if (event.target.value >= 0 && event.target.value !== "") {
    switch (type) {
      case 'buy': {
        $("#buy-btn").removeClass("disabled")
        contractInstance.calculateTokensReceived(web3.toWei(event.target.value, 'ether'), function (err, res) {
          if (res.c.join("") === "0") { res.c.join("error") }
          else {
            $("#buy-amount").val(prettyTokenView(res));
          }
        })
        break;
      }
      case 'sell': {
        $("#sell-btn").removeClass("disabled")
        contractInstance.calculateEthereumReceived(web3.toWei(event.target.value, 'ether'), function (err, res) {
          if (res.c.join("") === "0") { $("#sell-amount").val("error") }
          else {
            $("#sell-amount").val(prettyTokenView(res));
          }
        })
        break;
      }
    }
  }
  else {

    if (type === "buy") $("#buy-btn").addClass("disabled")
    if (type === "sell") $("#sell-btn").addClass("disabled")

    if (event.target.value < 0) event.target.value = 0;
  }

}

var getTotals = function () {

  contractInstance.totalEthereumBalance(function (err, res) {
    $("#total-eth").val(prettyTokenView(res));
  })
  contractInstance.totalSupply(function (err, res) {
    $("#total-ewt").val(prettyTokenView(res));
  })
}

var updatePrice = function () {
  contractInstance.buyPrice(function (err, res) {
    if (!err) $("#buyPrice").html(prettyTokenView(res) + " ETH");
  })
  contractInstance.sellPrice(function (err, res) {
    if (!err) $("#sellPrice").html(prettyTokenView(res) + " ETH");
  })
}

var prettyTokenView = function (res) {
  var str = "";
  if (res.e >= 14) {
    var val = res.c[0] + "";
    if (val === "0") return "0"
    else if (val.length > 4) {
      str = val.slice(0, val.length - 4) + "." + val.slice(val.length - 4)
    }
    else {
      str = "0." + "0".repeat(4 - val.length) + val;
    }
  }
  else {
    var val = res.c.join("");
    if (val === "0") return "0"
    if (val.length > 18) str = val.slice(0, val.length - 18)
    else {
      str = "0." + "0".repeat(18 - val.length) + val.slice(0, 3)
    }
  }

  return str;
}
