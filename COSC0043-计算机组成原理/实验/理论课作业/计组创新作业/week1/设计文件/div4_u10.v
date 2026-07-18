module div4_u10 (
    input  [9:0] x,
    output [7:0] y
);

assign y = x >> 2;

endmodule